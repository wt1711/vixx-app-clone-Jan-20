import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { Room } from 'matrix-js-sdk';
import { getMatrixClient } from 'src/services/matrixClient';
import {
  getOpenAIConsultation,
  generateResponseFromMessage,
  generateResponseWithIdea,
  gradeMessage,
  analyzeMessageIntent,
  gradeOwnMessage,
} from 'src/services/aiService';
import { isMessageFromMe, getLastReceivedMessageBatch } from 'src/utils/room';
import { parseAIResponse, ParsedAIResponse } from 'src/utils/aiResponseParser';
import { parseIntentAnalysis } from 'src/utils/intentAnalysisParser';
import type { ParsedIntentAnalysis } from 'src/types/intentAnalysis';
import type { MessageItem } from 'src/components/room/types';

type ChatMessage = {
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
};

// Dashboard metrics for the Vixx Insights header bar
export type DashboardMetrics = {
  interestScore: number; // 0-100
  interestLabel: 'High' | 'Medium' | 'Low' | 'Uncertain';
  interestEmoji: string;
  mood: string; // "Warm", "Playful", "Neutral", etc.
  moodEmoji: string;
  engagementLevel: 'Active' | 'Moderate' | 'Low';
  messageCountToday: number;
  avgResponseTime: string; // "3 min", "1 hr", etc.
  indicators: string[]; // Interest indicators
};

// Passive burst analysis result (for badges on messages)
export type BurstAnalysisResult = {
  burstEventIds: string[]; // Event IDs of messages in the burst
  interestScore: number;
  isOwnBurst: boolean;
  stateRead?: string; // Brief analysis text
  // Fields for Smart Moment classification
  sentiment?: 'positive' | 'neutral' | 'tense' | 'negative';
  hasSubtext?: boolean; // For 👀 hidden depth detection
  messageLengthTrend?: 'increasing' | 'same' | 'decreasing';
};

type AIAssistantContextType = {
  // State
  inputValue: string;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  generatedResponse: string;
  parsedResponse: ParsedAIResponse | null;
  isGeneratingResponse: boolean;
  isMobile: boolean;
  isAIAssistantOpen: boolean;
  prediction: { emoji: string; grade: string; score: number } | null;
  contextMessage: string | null; // Message context for "Ask Vixx" feature
  dashboardMetrics: DashboardMetrics | null; // Dashboard metrics for header bar

  // Intent Analysis State
  intentAnalysisResult: ParsedIntentAnalysis | null;
  isAnalyzingIntent: boolean;
  intentAnalysisError: string | null;
  isIntentAnalysisOpen: boolean;
  intentAnalysisBurst: MessageItem[];
  isAnalyzingOwnMessage: boolean; // True when analyzing user's outgoing messages

  // Passive Burst Analysis (for interest badges on all bursts)
  burstAnalyses: Map<string, BurstAnalysisResult>; // Key is first eventId of burst
  analyzingBurstIds: Set<string>; // Set of first eventIds currently being analyzed

  // Actions
  setInputValue: (value: string) => void;
  handleSend: () => void;
  sendQuickQuestion: (question: string) => void; // Send a predefined question immediately
  generateInitialResponse: (idea?: string) => void;
  regenerateResponse: (spec?: object) => void;
  handleUseSuggestion: (response: string) => void;
  clearChatHistory: () => void;
  toggleAIAssistant: (isOpen?: boolean) => void;
  gradeEditorText: (text: string) => void;
  clearParsedResponse: () => void;
  clearGeneratedResponse: () => void; // Clear the generated response and its context
  openAskVixx: (messageContent: string) => void; // Open AI assistant with message context
  clearContext: () => void; // Clear the context message without closing modal

  // Intent Analysis Actions
  analyzeIntentBurst: (messages: MessageItem[], isOwnMessage?: boolean) => void;
  closeIntentAnalysis: () => void;

  // Passive Burst Analysis Actions
  analyzeBurst: (messages: MessageItem[], isOwnBurst: boolean) => void;
  getBurstAnalysis: (firstEventId: string) => BurstAnalysisResult | undefined;
  isBurstAnalyzing: (firstEventId: string) => boolean;
  clearAllBurstAnalyses: () => void;

  // Analysis Mode (header button trigger)
  isAnalysisModeActive: boolean;
  toggleAnalysisMode: () => void;
};

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(
  undefined,
);

type AIAssistantProviderProps = {
  children: ReactNode;
  room: Room;
  isMobile: boolean;
};

export function AIAssistantProvider({
  children,
  room,
  isMobile,
}: AIAssistantProviderProps) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [parsedResponse, setParsedResponse] = useState<ParsedAIResponse | null>(
    null,
  );
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [prediction, setPrediction] = useState<{
    emoji: string;
    grade: string;
    score: number;
  } | null>(null);

  // Context message for "Ask Vixx" feature
  const [contextMessage, setContextMessage] = useState<string | null>(null);

  // Intent Analysis State
  const [intentAnalysisResult, setIntentAnalysisResult] =
    useState<ParsedIntentAnalysis | null>(null);
  const [isAnalyzingIntent, setIsAnalyzingIntent] = useState(false);
  const [intentAnalysisError, setIntentAnalysisError] = useState<string | null>(
    null,
  );
  const [isIntentAnalysisOpen, setIsIntentAnalysisOpen] = useState(false);
  const [intentAnalysisBurst, setIntentAnalysisBurst] = useState<MessageItem[]>(
    [],
  );
  const [isAnalyzingOwnMessage, setIsAnalyzingOwnMessage] = useState(false);

  // Analysis Mode state (triggered by header button)
  const [isAnalysisModeActive, setIsAnalysisModeActive] = useState(false);

  // Passive Burst Analysis state (for interest badges on all bursts)
  const [burstAnalyses, setBurstAnalyses] = useState<Map<string, BurstAnalysisResult>>(
    () => new Map(),
  );
  const [analyzingBurstIds, setAnalyzingBurstIds] = useState<Set<string>>(
    () => new Set(),
  );

  const mx = getMatrixClient();
  const myUserId = mx?.getUserId();

  // Compute dashboard metrics from room timeline
  const computeDashboardMetrics = useCallback((): DashboardMetrics => {
    if (!mx || !myUserId) {
      return {
        interestScore: 0,
        interestLabel: 'Uncertain',
        interestEmoji: '🤔',
        mood: 'Unknown',
        moodEmoji: '😐',
        engagementLevel: 'Low',
        messageCountToday: 0,
        avgResponseTime: '--',
        indicators: [],
      };
    }

    const timeline = room.getLiveTimeline().getEvents();
    const roomName = room.name || 'Unknown';
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);

    // Filter to text messages only
    const messages = timeline
      .filter(event => event.getType() === 'm.room.message' && event.getContent().body)
      .map(event => ({
        sender: event.getSender() as string,
        text: event.getContent().body as string,
        timestamp: event.getTs(),
        isFromMe: event.getSender() === myUserId,
      }));

    // Messages from the other person (not me)
    const theirMessages = messages.filter(m => !m.isFromMe);
    const myMessages = messages.filter(m => m.isFromMe);

    // Count messages today
    const messageCountToday = theirMessages.filter(m => m.timestamp >= todayStart).length;

    // Calculate average response time (their responses to my messages)
    let totalResponseTime = 0;
    let responseCount = 0;
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];
      if (prev.isFromMe && !curr.isFromMe) {
        const responseTime = curr.timestamp - prev.timestamp;
        if (responseTime < 24 * 60 * 60 * 1000) {
          // Within 24 hours
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }
    const avgResponseMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const avgResponseTime = formatResponseTime(avgResponseMs);

    // Analyze interest indicators
    const indicators: string[] = [];
    const recentTheirMessages = theirMessages.slice(-10);

    // Check for questions (shows interest/engagement)
    const hasQuestions = recentTheirMessages.some(m => m.text.includes('?'));
    if (hasQuestions) indicators.push('Asks questions');

    // Check for quick responses
    if (avgResponseMs > 0 && avgResponseMs < 5 * 60 * 1000) {
      indicators.push('Quick responses');
    }

    // Check for emoji usage
    const hasEmojis = recentTheirMessages.some(m => /[\u{1F300}-\u{1F9FF}]/u.test(m.text));
    if (hasEmojis) indicators.push('Uses emojis');

    // Check if they initiate conversations
    const initiations = messages.filter((m, i) => {
      if (i === 0) return !m.isFromMe;
      const prev = messages[i - 1];
      const timeSinceLast = m.timestamp - prev.timestamp;
      return !m.isFromMe && timeSinceLast > 4 * 60 * 60 * 1000; // 4 hours gap
    });
    if (initiations.length > 0) indicators.push('Initiates conversation');

    // Calculate interest score based on indicators
    let interestScore = 50; // Base score
    if (hasQuestions) interestScore += 10;
    if (avgResponseMs > 0 && avgResponseMs < 5 * 60 * 1000) interestScore += 15;
    if (avgResponseMs > 0 && avgResponseMs < 30 * 60 * 1000) interestScore += 5;
    if (hasEmojis) interestScore += 10;
    if (initiations.length > 0) interestScore += 15;
    if (messageCountToday >= 5) interestScore += 10;

    // Clamp to 0-100
    interestScore = Math.min(100, Math.max(0, interestScore));

    // Determine interest label
    let interestLabel: 'High' | 'Medium' | 'Low' | 'Uncertain';
    let interestEmoji: string;
    if (interestScore >= 70) {
      interestLabel = 'High';
      interestEmoji = '🔥';
    } else if (interestScore >= 50) {
      interestLabel = 'Medium';
      interestEmoji = '👍';
    } else if (interestScore >= 30) {
      interestLabel = 'Low';
      interestEmoji = '😐';
    } else {
      interestLabel = 'Uncertain';
      interestEmoji = '🤔';
    }

    // Analyze mood from recent messages
    const recentText = recentTheirMessages.map(m => m.text.toLowerCase()).join(' ');
    let mood = 'Neutral';
    let moodEmoji = '😊';

    if (/haha|hihi|lol|😂|🤣|😆/.test(recentText)) {
      mood = 'Playful';
      moodEmoji = '😜';
    } else if (/💕|❤️|🥰|yêu|thương|miss|nhớ/.test(recentText)) {
      mood = 'Warm';
      moodEmoji = '🥰';
    } else if (/\?.*\?|sao|gì|như thế nào/.test(recentText)) {
      mood = 'Curious';
      moodEmoji = '🤔';
    } else if (hasEmojis || /!/.test(recentText)) {
      mood = 'Enthusiastic';
      moodEmoji = '😊';
    }

    // Determine engagement level
    let engagementLevel: 'Active' | 'Moderate' | 'Low';
    if (messageCountToday >= 5 || (avgResponseMs > 0 && avgResponseMs < 10 * 60 * 1000)) {
      engagementLevel = 'Active';
    } else if (messageCountToday >= 2 || theirMessages.length > 10) {
      engagementLevel = 'Moderate';
    } else {
      engagementLevel = 'Low';
    }

    return {
      interestScore,
      interestLabel,
      interestEmoji,
      mood,
      moodEmoji,
      engagementLevel,
      messageCountToday,
      avgResponseTime,
      indicators,
    };
  }, [room, mx, myUserId]);

  // Helper function to format response time
  const formatResponseTime = (ms: number): string => {
    if (ms === 0) return '--';
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr`;
    return `${Math.floor(hours / 24)} day`;
  };

  // Compute metrics when modal opens
  const dashboardMetrics = useMemo(() => {
    if (!isAIAssistantOpen) return null;
    return computeDashboardMetrics();
  }, [isAIAssistantOpen, computeDashboardMetrics]);

  const toggleAIAssistant = useCallback((isOpen?: boolean) => {
    setIsAIAssistantOpen(prev => {
      const newIsOpen = isOpen ?? !prev;
      if (!newIsOpen) {
        setGeneratedResponse('');
        setParsedResponse(null);
        setContextMessage(null); // Clear context when closing
      }
      return newIsOpen;
    });
  }, []);

  // Open AI assistant with message context (for "Ask Vixx" feature)
  const openAskVixx = useCallback((messageContent: string) => {
    // Clear previous chat history when starting a new "Ask Vixx" session
    setChatHistory([]);
    setGeneratedResponse('');
    setParsedResponse(null);
    // Set the new context and open the modal
    setContextMessage(messageContent);
    setIsAIAssistantOpen(true);
  }, []);

  // Clear the context message without closing the modal
  const clearContext = useCallback(() => {
    setContextMessage(null);
  }, []);

  const clearParsedResponse = useCallback(() => {
    setParsedResponse(null);
  }, []);

  // Clear the generated response and its associated context
  const clearGeneratedResponse = useCallback(() => {
    setGeneratedResponse('');
    setParsedResponse(null);
    // Only clear context if it's a suggested response context
    setContextMessage(prev =>
      prev?.startsWith('Suggested response:') ? null : prev
    );
  }, []);

  const handleUseSuggestion = useCallback(
    (response: string) => {
      if (response) {
        let cleanedResponse = response.trim();
        if (
          (cleanedResponse.startsWith('"') && cleanedResponse.endsWith('"')) ||
          (cleanedResponse.startsWith("'") && cleanedResponse.endsWith("'"))
        ) {
          cleanedResponse = cleanedResponse.substring(
            1,
            cleanedResponse.length - 1,
          );
        }
        // In React Native, we would insert this into the message input
        // For now, we'll just set it as input value
        setInputValue(cleanedResponse);
        if (isMobile) {
          setIsAIAssistantOpen(false);
        }
      }
    },
    [isMobile],
  );

  const generateInitialResponse = useCallback(
    async (idea?: string) => {
      // Generate response without opening the modal
      const spec = idea ? { idea } : {};
      await regenerateResponse(spec);
    },
    [],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const regenerateResponse = useCallback(
    async (spec = {}) => {
      setIsGeneratingResponse(true);

      try {
        if (!mx || !myUserId) return;

        // Get the actual room conversation from timeline
        const timeline = room.getLiveTimeline().getEvents();
        const roomName = room.name || 'Unknown';
        const roomContext = timeline
          .filter(event => event.getSender() && event.getContent().body)
          .map(event => {
            const sender = event.getSender() as string;
            const senderMember = room.getMember(sender);
            const senderName =
              senderMember?.name ||
              sender.split('@')[0]?.split(':')[0] ||
              'Unknown';
            return {
              sender,
              text: event.getContent().body as string,
              timestamp: new Date(event.getTs()).toISOString(),
              is_from_me: isMessageFromMe(
                sender,
                myUserId,
                roomName,
                senderName,
              ),
            };
          });

        const { messageBatch, timestampStr } =
          getLastReceivedMessageBatch(roomContext);

        // Use different endpoint based on whether idea is provided
        const hasIdea =
          spec && 'idea' in spec && (spec as { idea?: string }).idea;
        const generateFn = hasIdea
          ? generateResponseWithIdea
          : generateResponseFromMessage;

        const response = await generateFn({
          message: messageBatch,
          lastMsgTimeStamp: timestampStr,
          context: roomContext,
          spec,
          userId: myUserId,
        });
        setGeneratedResponse(response);

        // Parse the response to separate emotion, reason, and message
        const parsed = parseAIResponse(response);
        setParsedResponse(parsed);

        // Set the suggested response as context for AI interactions
        // This way, questions in the modal will be about the suggested response
        setContextMessage(`Suggested response: ${response}`);

        // Don't auto-insert - let user explicitly press "Use" button
        // The modal stays open so user can review and choose to use or regenerate
      } catch (error) {
        console.error('Error in regenerateResponse:', error);
        setGeneratedResponse('Xin lỗi, đã có lỗi');
      } finally {
        setIsGeneratingResponse(false);
      }
    },
    [room, mx, myUserId],
  );

  const handleSend = useCallback(async () => {
    if (inputValue.trim() === '' || !mx || !myUserId) return;

    const newUserMessage: ChatMessage = {
      sender: 'user',
      text: inputValue,
      timestamp: Date.now(),
    };
    setChatHistory(prev => [...prev, newUserMessage]);
    const question = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Get the actual room conversation from timeline
      const timeline = room.getLiveTimeline().getEvents();
      const roomName = room.name || 'Unknown';
      const roomContext = timeline
        .filter(event => event.getSender() && event.getContent().body)
        .map(event => {
          const sender = event.getSender() as string;
          const senderMember = room.getMember(sender);
          const senderName =
            senderMember?.name ||
            sender.split('@')[0]?.split(':')[0] ||
            'Unknown';
          return {
            sender,
            text: event.getContent().body as string,
            timestamp: new Date(event.getTs()).toISOString(),
            is_from_me: isMessageFromMe(sender, myUserId, roomName, senderName),
          };
        });

      const lastNonUserMsg = [...roomContext]
        .reverse()
        .find(msg => !msg.is_from_me);
      const msgToGetResponse = lastNonUserMsg || {
        sender: 'system',
        text: 'Nói gì cũng được',
        timestamp: new Date().toISOString(),
        is_from_me: false,
      };

      // Pass chat history for conversation memory (ChatGPT-style)
      const response = await getOpenAIConsultation({
        context: roomContext,
        selectedMessage: msgToGetResponse,
        question,
        chatHistory: chatHistory.map(msg => ({
          sender: msg.sender,
          text: msg.text,
        })),
        contextMessage,
      });

      const aiResponse: ChatMessage = {
        sender: 'ai',
        text: response,
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, aiResponse]);
    } catch (error) {
      console.info('Error in handleSend:', error);
      const errorResponse: ChatMessage = {
        sender: 'ai',
        text: 'Sorry, there was an error processing your request.',
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, room, mx, myUserId, chatHistory, contextMessage]);

  // Send a predefined question directly (for suggestion chips)
  const sendQuickQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || !mx || !myUserId) return;

      const newUserMessage: ChatMessage = {
        sender: 'user',
        text: question,
        timestamp: Date.now(),
      };
      setChatHistory(prev => [...prev, newUserMessage]);
      setIsLoading(true);

      try {
        // Get the actual room conversation from timeline
        const timeline = room.getLiveTimeline().getEvents();
        const roomName = room.name || 'Unknown';
        const roomContext = timeline
          .filter(event => event.getSender() && event.getContent().body)
          .map(event => {
            const sender = event.getSender() as string;
            const senderMember = room.getMember(sender);
            const senderName =
              senderMember?.name ||
              sender.split('@')[0]?.split(':')[0] ||
              'Unknown';
            return {
              sender,
              text: event.getContent().body as string,
              timestamp: new Date(event.getTs()).toISOString(),
              is_from_me: isMessageFromMe(sender, myUserId, roomName, senderName),
            };
          });

        const lastNonUserMsg = [...roomContext]
          .reverse()
          .find(msg => !msg.is_from_me);
        const msgToGetResponse = lastNonUserMsg || {
          sender: 'system',
          text: 'Nói gì cũng được',
          timestamp: new Date().toISOString(),
          is_from_me: false,
        };

        // Pass current chat history for conversation memory
        const response = await getOpenAIConsultation({
          context: roomContext,
          selectedMessage: msgToGetResponse,
          question,
          chatHistory: chatHistory.map(msg => ({
            sender: msg.sender,
            text: msg.text,
          })),
          contextMessage,
        });

        const aiResponse: ChatMessage = {
          sender: 'ai',
          text: response,
          timestamp: Date.now(),
        };
        setChatHistory(prev => [...prev, aiResponse]);
      } catch (error) {
        console.info('Error in sendQuickQuestion:', error);
        const errorResponse: ChatMessage = {
          sender: 'ai',
          text: 'Sorry, there was an error processing your request.',
          timestamp: Date.now(),
        };
        setChatHistory(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    },
    [room, mx, myUserId, chatHistory, contextMessage],
  );

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  // Analysis Mode toggle (header button)
  const toggleAnalysisMode = useCallback(() => {
    setIsAnalysisModeActive(prev => !prev);
  }, []);

  // Intent Analysis Functions
  const closeIntentAnalysis = useCallback(() => {
    setIsIntentAnalysisOpen(false);
    setIntentAnalysisResult(null);
    setIntentAnalysisError(null);
    setIntentAnalysisBurst([]);
    setIsAnalyzingOwnMessage(false);
    // Auto-exit analysis mode when closing overlay
    setIsAnalysisModeActive(false);
  }, []);

  const analyzeIntentBurst = useCallback(
    async (messages: MessageItem[], isOwnMessage: boolean = false) => {
      if (!mx || !myUserId || messages.length === 0) return;

      setIntentAnalysisBurst(messages);
      setIsIntentAnalysisOpen(true);
      setIsAnalyzingIntent(true);
      setIntentAnalysisError(null);
      setIntentAnalysisResult(null);
      setIsAnalyzingOwnMessage(isOwnMessage);

      try {
        const timeline = room.getLiveTimeline().getEvents();
        const roomName = room.name || 'Unknown';
        const roomContext = timeline
          .filter(event => event.getSender() && event.getContent().body)
          .map(event => {
            const sender = event.getSender() as string;
            const senderMember = room.getMember(sender);
            const senderName =
              senderMember?.name ||
              sender.split('@')[0]?.split(':')[0] ||
              'Unknown';
            return {
              sender,
              text: event.getContent().body as string,
              timestamp: new Date(event.getTs()).toISOString(),
              is_from_me: isMessageFromMe(
                sender,
                myUserId,
                roomName,
                senderName,
              ),
            };
          });

        // Join all messages in the burst with newlines for analysis
        const burstText = messages.map(m => m.content).join('\n');
        const firstMessage = messages[0];

        // Use different analysis based on whether it's own message or counterparty's
        const analysisFunction = isOwnMessage ? gradeOwnMessage : analyzeMessageIntent;

        const result = await analysisFunction({
          message: {
            text: burstText,
            sender: firstMessage.senderName,
            timestamp: new Date(firstMessage.timestamp).toISOString(),
          },
          context: roomContext,
          userId: myUserId,
        });

        const parsed = parseIntentAnalysis(result, JSON.stringify(result));
        setIntentAnalysisResult(parsed);
      } catch (error) {
        console.error('Error analyzing intent:', error);
        setIntentAnalysisError(
          'Failed to analyze message intent. Please try again.',
        );
      } finally {
        setIsAnalyzingIntent(false);
      }
    },
    [room, mx, myUserId],
  );

  // Passive Burst Analysis Functions (for interest badges on all bursts - no overlay)
  const analyzeBurst = useCallback(
    async (messages: MessageItem[], isOwnBurst: boolean) => {
      if (!mx || !myUserId || messages.length === 0) return;

      const eventIds = messages.map(m => m.eventId);
      const firstEventId = eventIds[0];

      // Don't re-analyze if already analyzed or currently analyzing
      if (burstAnalyses.has(firstEventId) || analyzingBurstIds.has(firstEventId)) {
        return;
      }

      // Mark as analyzing
      setAnalyzingBurstIds(prev => new Set(prev).add(firstEventId));

      try {
        const timeline = room.getLiveTimeline().getEvents();
        const roomName = room.name || 'Unknown';
        const roomContext = timeline
          .filter(event => event.getSender() && event.getContent().body)
          .map(event => {
            const sender = event.getSender() as string;
            const senderMember = room.getMember(sender);
            const senderName =
              senderMember?.name ||
              sender.split('@')[0]?.split(':')[0] ||
              'Unknown';
            return {
              sender,
              text: event.getContent().body as string,
              timestamp: new Date(event.getTs()).toISOString(),
              is_from_me: isMessageFromMe(
                sender,
                myUserId,
                roomName,
                senderName,
              ),
            };
          });

        const burstText = messages.map(m => m.content).join('\n');
        const firstMessage = messages[0];

        // Use different analysis based on whether it's own or counterparty's messages
        const analysisFunction = isOwnBurst ? gradeOwnMessage : analyzeMessageIntent;

        const result = await analysisFunction({
          message: {
            text: burstText,
            sender: firstMessage.senderName,
            timestamp: new Date(firstMessage.timestamp).toISOString(),
          },
          context: roomContext,
          userId: myUserId,
        });

        const parsed = parseIntentAnalysis(result, JSON.stringify(result));

        // Derive sentiment from emotional tone
        const toneLower = parsed.emotionalTone?.primary?.toLowerCase() || '';
        let sentiment: 'positive' | 'neutral' | 'tense' | 'negative' | undefined;
        if (['warm', 'playful', 'flirty', 'excited', 'enthusiastic', 'happy'].some(t => toneLower.includes(t))) {
          sentiment = 'positive';
        } else if (['tense', 'defensive', 'confrontational', 'challenging'].some(t => toneLower.includes(t))) {
          sentiment = 'tense';
        } else if (['cold', 'dismissive', 'annoyed', 'frustrated', 'angry'].some(t => toneLower.includes(t))) {
          sentiment = 'negative';
        } else {
          sentiment = 'neutral';
        }

        // Check for hidden meanings / subtext
        const hasSubtext = (parsed.hiddenMeanings && parsed.hiddenMeanings.length > 0) || false;

        // Calculate message length trend from burst messages
        let messageLengthTrend: 'increasing' | 'same' | 'decreasing' | undefined;
        if (messages.length >= 2) {
          const lengths = messages.map(m => m.content?.length || 0);
          const firstHalf = lengths.slice(0, Math.floor(lengths.length / 2));
          const secondHalf = lengths.slice(Math.floor(lengths.length / 2));
          const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

          if (avgSecond > avgFirst * 1.2) {
            messageLengthTrend = 'increasing';
          } else if (avgSecond < avgFirst * 0.8) {
            messageLengthTrend = 'decreasing';
          } else {
            messageLengthTrend = 'same';
          }
        }

        // Store the analysis result with smart moment fields
        setBurstAnalyses(prev => {
          const newMap = new Map(prev);
          newMap.set(firstEventId, {
            burstEventIds: eventIds,
            interestScore: parsed.interestLevel.score,
            isOwnBurst,
            stateRead: parsed.stateRead,
            sentiment,
            hasSubtext,
            messageLengthTrend,
          });
          return newMap;
        });
      } catch (error) {
        console.error('Error in burst analysis:', error);
        // Silently fail - don't show badge for this burst
      } finally {
        // Remove from analyzing set
        setAnalyzingBurstIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(firstEventId);
          return newSet;
        });
      }
    },
    [room, mx, myUserId, burstAnalyses, analyzingBurstIds],
  );

  const getBurstAnalysis = useCallback(
    (firstEventId: string) => burstAnalyses.get(firstEventId),
    [burstAnalyses],
  );

  const isBurstAnalyzing = useCallback(
    (firstEventId: string) => analyzingBurstIds.has(firstEventId),
    [analyzingBurstIds],
  );

  const clearAllBurstAnalyses = useCallback(() => {
    setBurstAnalyses(new Map());
    setAnalyzingBurstIds(new Set());
  }, []);

  const gradeEditorText = useCallback(
    async (text: string) => {
      if (text.trim().length > 0 && mx && myUserId) {
        const timeline = room.getLiveTimeline().getEvents();
        const roomName = room.name || 'Unknown';
        const roomContext = timeline
          .filter(event => event.getSender() && event.getContent().body)
          .map(event => {
            const sender = event.getSender() as string;
            const senderMember = room.getMember(sender);
            const senderName =
              senderMember?.name ||
              sender.split('@')[0]?.split(':')[0] ||
              'Unknown';
            return {
              sender,
              text: event.getContent().body as string,
              timestamp: new Date(event.getTs()).toISOString(),
              is_from_me: isMessageFromMe(
                sender,
                myUserId,
                roomName,
                senderName,
              ),
            };
          });

        const score = await gradeMessage({
          message: text,
          context: roomContext,
        });
        // Simple grade mapping
        const getReactionGrade = (newScore: number) => {
          if (newScore >= 80) return { emoji: '😊', grade: 'Excellent' };
          if (newScore >= 60) return { emoji: '👍', grade: 'Good' };
          if (newScore >= 40) return { emoji: '😐', grade: 'Average' };
          return { emoji: '😕', grade: 'Needs Improvement' };
        };
        const analysis = getReactionGrade(score);
        setPrediction({ ...analysis, score });
      } else {
        setPrediction(null);
      }
    },
    [room, mx, myUserId],
  );

  const value: AIAssistantContextType = useMemo(
    () => ({
      inputValue,
      chatHistory,
      isLoading,
      generatedResponse,
      parsedResponse,
      isGeneratingResponse,
      isMobile,
      isAIAssistantOpen,
      prediction,
      contextMessage,
      dashboardMetrics,

      // Intent Analysis State
      intentAnalysisResult,
      isAnalyzingIntent,
      intentAnalysisError,
      isIntentAnalysisOpen,
      intentAnalysisBurst,
      isAnalyzingOwnMessage,

      // Passive Burst Analysis State
      burstAnalyses,
      analyzingBurstIds,

      setInputValue,
      handleSend,
      sendQuickQuestion,
      generateInitialResponse,
      regenerateResponse,
      handleUseSuggestion,
      clearChatHistory,
      toggleAIAssistant,
      gradeEditorText,
      clearParsedResponse,
      clearGeneratedResponse,
      openAskVixx,
      clearContext,

      // Intent Analysis Actions
      analyzeIntentBurst,
      closeIntentAnalysis,

      // Passive Burst Analysis Actions
      analyzeBurst,
      getBurstAnalysis,
      isBurstAnalyzing,
      clearAllBurstAnalyses,

      // Analysis Mode
      isAnalysisModeActive,
      toggleAnalysisMode,
    }),
    [
      inputValue,
      chatHistory,
      isLoading,
      generatedResponse,
      parsedResponse,
      isGeneratingResponse,
      isMobile,
      isAIAssistantOpen,
      prediction,
      contextMessage,
      dashboardMetrics,
      intentAnalysisResult,
      isAnalyzingIntent,
      intentAnalysisError,
      isIntentAnalysisOpen,
      intentAnalysisBurst,
      isAnalyzingOwnMessage,
      burstAnalyses,
      analyzingBurstIds,
      handleSend,
      sendQuickQuestion,
      generateInitialResponse,
      regenerateResponse,
      handleUseSuggestion,
      toggleAIAssistant,
      gradeEditorText,
      clearParsedResponse,
      clearGeneratedResponse,
      openAskVixx,
      analyzeIntentBurst,
      closeIntentAnalysis,
      analyzeBurst,
      getBurstAnalysis,
      isBurstAnalyzing,
      clearAllBurstAnalyses,
      isAnalysisModeActive,
      toggleAnalysisMode,
    ],
  );

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error(
      'useAIAssistant must be used within an AIAssistantProvider',
    );
  }
  return context;
}
