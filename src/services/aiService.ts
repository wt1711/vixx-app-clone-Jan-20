import { API_ENDPOINTS } from 'src/config/env';
import type {
  IntentAnalysisResult,
  IntentAnalysisRequest,
  ResponseDirection,
  DirectionGenerationResult,
} from 'src/types/intentAnalysis';

export type Message = {
  sender: string;
  text: string;
  timestamp: string;
  is_from_me: boolean;
};

export type ChatHistoryMessage = {
  sender: 'user' | 'ai';
  text: string;
};

// Mock consultation response generator for development/testing
function generateMockConsultation(
  question: string,
  contextMessage: string | null | undefined,
  chatHistory: ChatHistoryMessage[],
): string {
  const questionLower = question.toLowerCase();

  // Context-aware responses based on question keywords
  if (questionLower.includes('interest') || questionLower.includes('like')) {
    return 'Based on the conversation, they seem genuinely interested! They\'re responding quickly and asking questions - both good signs. Keep the energy positive and match their vibe.';
  }

  if (questionLower.includes('mean') || questionLower.includes('what')) {
    const contextPart = contextMessage
      ? `Looking at "${contextMessage}" - `
      : '';
    return `${contextPart}They're being friendly and keeping the conversation going. It's a good sign that they're engaging with you. I'd suggest responding warmly and maybe asking them something in return.`;
  }

  if (questionLower.includes('respond') || questionLower.includes('reply') || questionLower.includes('say')) {
    return 'I\'d suggest keeping it light and matching their energy. Something casual but warm would work well here. You could acknowledge what they said and ask a follow-up question to keep things flowing.';
  }

  if (questionLower.includes('mood') || questionLower.includes('feel') || questionLower.includes('tone')) {
    return 'The tone seems positive and friendly! They\'re being open and engaging, which is a great sign. I\'d recommend keeping things warm and playful.';
  }

  if (questionLower.includes('strategy') || questionLower.includes('approach') || questionLower.includes('advice')) {
    return 'My advice: Stay authentic and match their communication style. They seem comfortable with you, so keep being yourself. Ask questions to show interest, and share a bit about yourself too.';
  }

  // Check if this is a follow-up question (has chat history)
  if (chatHistory.length > 0) {
    return `Building on what I mentioned earlier - ${question.includes('?') ? 'yes, ' : ''}I think you're on the right track. Just stay natural and keep the conversation balanced. Show interest but don't overthink it!`;
  }

  // Default response
  return 'That\'s a good question! Based on the conversation context, things seem to be going well. Keep the energy positive and be yourself - that\'s the best approach. Is there something specific you\'d like me to analyze?';
}

export async function getOpenAIConsultation({
  context,
  selectedMessage,
  question,
  chatHistory = [],
  contextMessage,
}: {
  context: Message[];
  selectedMessage: Message;
  question?: string;
  chatHistory?: ChatHistoryMessage[];
  contextMessage?: string | null;
}): Promise<string> {
  // Check if API endpoint is configured
  const endpoint = API_ENDPOINTS.AI.SUGGESTION;
  const isEndpointConfigured =
    endpoint && !endpoint.startsWith('undefined') && endpoint.length > 20;

  if (!isEndpointConfigured) {
    console.info('Using mock consultation (API not configured)');
    // Simulate network delay for realistic UX
    await new Promise<void>(resolve => setTimeout(resolve, 800 + Math.random() * 600));
    return generateMockConsultation(question || '', contextMessage, chatHistory);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        selectedMessage,
        question,
        chatHistory,
        contextMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || 'Failed to fetch suggestion from server.',
      );
    }

    const data = await response.json();
    return data.suggestion;
  } catch (error) {
    console.warn('API call failed, falling back to mock consultation:', error);
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return generateMockConsultation(question || '', contextMessage, chatHistory);
  }
}

export async function generateResponseFromMessage({
  message,
  lastMsgTimeStamp,
  context,
  spec,
  userId,
}: {
  message: string;
  lastMsgTimeStamp: string;
  context: Message[];
  spec: object;
  userId?: string;
}): Promise<string> {
  try {
    const response = await fetch(API_ENDPOINTS.AI.GENERATE_RESPONSE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        lastMsgTimeStamp,
        context,
        spec,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || 'Failed to generate response from server.',
      );
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error in generateResponseFromMessage:', error);
    return 'Xin lỗi, đã có lỗi khi tạo phản hồi.';
  }
}

export async function generateResponseWithIdea({
  message,
  lastMsgTimeStamp,
  context,
  spec,
  userId,
}: {
  message: string;
  lastMsgTimeStamp: string;
  context: Message[];
  spec: object;
  userId?: string;
}): Promise<string> {
  try {
    const response = await fetch(API_ENDPOINTS.AI.GENERATE_RESPONSE_WITH_IDEA, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        lastMsgTimeStamp,
        context,
        spec,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || 'Failed to generate response with idea from server.',
      );
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error in generateResponseWithIdea:', error);
    return 'Xin lỗi, đã có lỗi khi tạo phản hồi.';
  }
}

export async function gradeMessage({
  message,
  context,
}: {
  message: string;
  context: Message[];
}): Promise<number> {
  try {
    const response = await fetch(API_ENDPOINTS.AI.GRADE_RESPONSE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        response: message,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || 'Failed to grade message from server.',
      );
    }

    const data = await response.json();
    return data.score || 0;
  } catch (error) {
    console.error('Error in gradeMessage:', error);
    return 0;
  }
}

export type CreditsInfo = {
  creditsRemaining: number | string;
  totalCredits: number | string;
};

export async function getCreditsRemaining(
  userId: string,
): Promise<CreditsInfo> {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.AI.CREDITS_REMAINING}?userId=${encodeURIComponent(
        userId,
      )}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch credits remaining.');
    }

    const data = await response.json();
    return {
      creditsRemaining: data.creditsRemaining ?? 0,
      totalCredits: data.totalCredits ?? 50, // Default to 50 if not provided
    };
  } catch (error) {
    console.error('Error in getCreditsRemaining:', error);
    return { creditsRemaining: 0, totalCredits: 50 };
  }
}

// Direction templates for different response approaches
const DIRECTION_TEMPLATES: ResponseDirection[] = [
  { label: 'Confirm enthusiastically', tone: 'excited', emoji: '🎉', description: 'Show excitement about the plans' },
  { label: 'Ask for details', tone: 'curious', emoji: '🤔', description: 'Get more specifics about timing/place' },
  { label: 'Playful tease', tone: 'playful', emoji: '😜', description: 'Light teasing to build chemistry' },
  { label: 'Warm acceptance', tone: 'warm', emoji: '🥰', description: 'Accept warmly and show appreciation' },
  { label: 'Suggest alternative', tone: 'helpful', emoji: '💡', description: 'Propose a different time or place' },
  { label: 'Match their energy', tone: 'mirroring', emoji: '🪞', description: 'Reflect their vibe back' },
  { label: 'Show interest', tone: 'interested', emoji: '😊', description: 'Express genuine interest in them' },
  { label: 'Keep it casual', tone: 'casual', emoji: '😎', description: 'Low-key response, no pressure' },
];

// Mock response generator for development/testing
function generateMockIntentAnalysis(
  messageText: string,
): IntentAnalysisResult {
  // Simple heuristics for mock data
  const hasQuestion = messageText.includes('?') || messageText.includes('k');
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(messageText);
  const messageLength = messageText.length;
  const wordCount = messageText.split(/\s+/).length;

  // Generate interest score based on message characteristics
  let interestScore = 50;
  if (hasQuestion) interestScore += 15;
  if (hasEmoji) interestScore += 10;
  if (wordCount > 5) interestScore += 10;
  if (messageLength > 50) interestScore += 5;
  interestScore = Math.min(95, Math.max(30, interestScore));

  const getInterestLabel = (
    score: number,
  ): 'Very High' | 'High' | 'Moderate' | 'Low' | 'Uncertain' => {
    if (score >= 80) return 'Very High';
    if (score >= 65) return 'High';
    if (score >= 45) return 'Moderate';
    if (score >= 25) return 'Low';
    return 'Uncertain';
  };

  const indicators: string[] = [];
  if (hasQuestion) indicators.push('Asks questions - showing curiosity');
  if (hasEmoji) indicators.push('Uses expressive language');
  if (wordCount > 3) indicators.push('Puts effort into responses');
  if (messageLength > 30) indicators.push('Engages with detailed messages');
  if (indicators.length === 0) indicators.push('Keeping conversation going');

  const tones = [
    { primary: 'Playful', secondary: 'Friendly' },
    { primary: 'Flirty', secondary: 'Interested' },
    { primary: 'Casual', secondary: 'Relaxed' },
    { primary: 'Curious', secondary: 'Engaged' },
    { primary: 'Warm', secondary: 'Open' },
  ];
  const selectedTone = tones[Math.floor(Math.random() * tones.length)];

  // Generate contextual stateRead based on message content
  const stateReadOptions = [
    `They seem ${selectedTone.primary.toLowerCase()} and interested in connecting. ${hasQuestion ? 'The question shows they want to include you.' : 'Keep the momentum going!'}`,
    `Showing clear interest in spending time together. Their tone is ${selectedTone.primary.toLowerCase()} and engaging.`,
    `They're reaching out and keeping the conversation active. ${interestScore >= 60 ? 'Good sign of genuine interest!' : 'Respond to keep things flowing.'}`,
  ];

  // Select directions based on context
  // Pick a recommended direction based on message characteristics
  let recommendedDirection: ResponseDirection;
  if (hasQuestion) {
    recommendedDirection = DIRECTION_TEMPLATES[0]; // Confirm enthusiastically
  } else if (interestScore >= 70) {
    recommendedDirection = DIRECTION_TEMPLATES[3]; // Warm acceptance
  } else {
    recommendedDirection = DIRECTION_TEMPLATES[5]; // Match their energy
  }

  // Pick 2-3 alternative directions
  const availableAlternatives = DIRECTION_TEMPLATES.filter(
    d => d.label !== recommendedDirection.label,
  );
  const shuffled = availableAlternatives.sort(() => Math.random() - 0.5);
  const alternativeDirections = shuffled.slice(0, 3);

  return {
    interestLevel: {
      score: interestScore,
      label: getInterestLabel(interestScore),
      indicators,
    },
    emotionalTone: {
      primary: selectedTone.primary,
      secondary: selectedTone.secondary,
      confidence: 70 + Math.floor(Math.random() * 20),
    },

    // Directions-based actionable fields
    stateRead: stateReadOptions[Math.floor(Math.random() * stateReadOptions.length)],
    recommendedDirection,
    alternativeDirections,

    // Legacy fields (for backwards compatibility)
    hiddenMeanings: [],
    suggestedInterpretation: stateReadOptions[0],
    responseAdvice: 'Match their energy and respond naturally.',

    analysisTimestamp: new Date().toISOString(),
    messageId: `mock-${Date.now()}`,
  };
}

// Mock generator for direction-based message generation
function generateMockDirectionResponse(
  direction: ResponseDirection,
  _messageText: string,
): DirectionGenerationResult {
  // Map direction tones to Vietnamese responses with reasoning
  const responseMap: Record<string, { messages: string[]; reasonings: string[]; emotion: string }> = {
    excited: {
      messages: [
        'Oke luôn, hẹn gặp nha! 🎉',
        'Chắc rồi! Mong gặp lắm luôn 😊',
        'Được luôn á! Hype quá trời 🔥',
      ],
      reasonings: [
        'Showing enthusiasm matches their energy and signals clear interest',
        'Excitement is contagious - it makes them feel good about the plans',
        'High energy response builds anticipation for meeting up',
      ],
      emotion: 'Excited',
    },
    curious: {
      messages: [
        'Oke nha, mà gặp ở đâu vậy?',
        'Được nè, mấy giờ là oke nhất?',
        'Chắc rồi! Mà đi đâu vậy ta? 🤔',
      ],
      reasonings: [
        'Asking details shows you care about making it work',
        'Getting specifics helps plan better and shows investment',
        'Questions keep the conversation going and show engagement',
      ],
      emotion: 'Curious',
    },
    playful: {
      messages: [
        'Hmmm để xem lịch cái đã nha 😏',
        'Oke oke, nhưng e phải đãi a nha 😜',
        'Được thôi, nhưng phải vui nha! 🤭',
      ],
      reasonings: [
        'Playful teasing creates chemistry and keeps things fun',
        'Light humor shows confidence and personality',
        'Teasing builds tension in a positive way',
      ],
      emotion: 'Playful',
    },
    warm: {
      messages: [
        'Oke e, gặp nhau nha 💕',
        'Được luôn, mong gặp e lắm',
        'Chắc chắn rồi, hẹn gặp nha 🥰',
      ],
      reasonings: [
        'Warm responses make them feel valued and appreciated',
        'Showing genuine care builds emotional connection',
        'Affectionate tone deepens the bond between you',
      ],
      emotion: 'Warm',
    },
    helpful: {
      messages: [
        'Hmm 4h hơi sớm, 5h được không?',
        'Oke nha, mà gặp ở chỗ khác được không?',
        'Được nè, nhưng để a check lịch lại nha',
      ],
      reasonings: [
        'Suggesting alternatives shows you want to make it work',
        'Being flexible while having preferences shows maturity',
        'Offering options keeps the conversation productive',
      ],
      emotion: 'Thoughtful',
    },
    mirroring: {
      messages: [
        'Oke e 👍',
        'Được nha, gặp lúc đó!',
        'Chắc rồi, hẹn gặp!',
      ],
      reasonings: [
        'Matching their communication style creates rapport',
        'Mirroring energy makes them feel understood',
        'Simple agreement when appropriate shows you\'re on the same page',
      ],
      emotion: 'Relaxed',
    },
    interested: {
      messages: [
        'Oke luôn! Muốn gặp e lắm rồi 😊',
        'Được nha, lâu rồi không gặp',
        'Chắc chắn! Mong lắm luôn á',
      ],
      reasonings: [
        'Expressing interest directly shows confidence',
        'Saying you want to see them makes them feel special',
        'Direct interest signals are clear and attractive',
      ],
      emotion: 'Interested',
    },
    casual: {
      messages: [
        'Oke',
        'Được, gặp lúc đó nha',
        'Sure, hẹn gặp 👍',
      ],
      reasonings: [
        'Casual response avoids coming on too strong',
        'Low-key energy can be attractive - not desperate',
        'Sometimes less is more in conversation',
      ],
      emotion: 'Casual',
    },
  };

  const responses = responseMap[direction.tone] || responseMap.mirroring;
  const randomIdx = Math.floor(Math.random() * responses.messages.length);

  return {
    message: responses.messages[randomIdx],
    reasoning: responses.reasonings[randomIdx],
    emotion: responses.emotion,
  };
}

// Generate a message based on a selected direction
export async function generateFromDirection({
  direction,
  messageText,
  context,
  userId,
}: {
  direction: ResponseDirection;
  messageText: string;
  context: Message[];
  userId?: string;
}): Promise<DirectionGenerationResult> {
  // Check if API endpoint is configured
  const endpoint = API_ENDPOINTS.AI.GENERATE_FROM_DIRECTION;
  const isEndpointConfigured =
    endpoint && !endpoint.startsWith('undefined') && endpoint.length > 20;

  if (!isEndpointConfigured) {
    console.info('Using mock direction generation (API not configured)');
    // Simulate network delay
    await new Promise<void>(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    return generateMockDirectionResponse(direction, messageText);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        direction,
        messageText,
        context,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate from direction.');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.warn('API call failed, falling back to mock generation:', error);
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return generateMockDirectionResponse(direction, messageText);
  }
}

// Mock generator for grading user's own messages
function generateMockMessageGrade(
  messageText: string,
  context: Message[],
): IntentAnalysisResult {
  const hasQuestion = messageText.includes('?');
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(messageText);
  const messageLength = messageText.length;
  const wordCount = messageText.split(/\s+/).length;

  // Calculate grade based on message quality
  let gradeScore = 60;
  if (hasQuestion) gradeScore += 10; // Questions show engagement
  if (hasEmoji) gradeScore += 5; // Emojis add warmth
  if (wordCount >= 3 && wordCount <= 15) gradeScore += 10; // Good length
  if (messageLength > 5 && messageLength < 100) gradeScore += 5; // Not too short/long

  // Check for positive language patterns
  if (/oke|ok|được|chắc|rồi|nha/i.test(messageText)) gradeScore += 5;
  if (/❤️|💕|🥰|😊|😍/u.test(messageText)) gradeScore += 5;

  gradeScore = Math.min(95, Math.max(40, gradeScore));

  const getGradeLabel = (
    score: number,
  ): 'Very High' | 'High' | 'Moderate' | 'Low' | 'Uncertain' => {
    if (score >= 85) return 'Very High';
    if (score >= 70) return 'High';
    if (score >= 55) return 'Moderate';
    if (score >= 40) return 'Low';
    return 'Uncertain';
  };

  // Generate feedback based on message characteristics
  const feedbackOptions: string[] = [];

  if (gradeScore >= 80) {
    feedbackOptions.push(
      'Great response! Clear, warm, and engaging. This keeps the conversation flowing naturally.',
      'Solid message! Shows interest while staying relaxed. Good balance.',
      'Nice job! Your message is friendly and inviting without being too much.',
    );
  } else if (gradeScore >= 65) {
    feedbackOptions.push(
      'Good response. Consider adding a question to keep them engaged.',
      'Decent message. A bit more enthusiasm could help build connection.',
      'Okay response. Try matching their energy level more closely.',
    );
  } else {
    feedbackOptions.push(
      'Could be stronger. Try adding more warmth or a follow-up question.',
      'A bit short. Consider expanding to show more interest.',
      'Try to engage more. Ask something about them or share something personal.',
    );
  }

  const indicators: string[] = [];
  if (hasQuestion) indicators.push('Asks follow-up question');
  if (hasEmoji) indicators.push('Uses expressive language');
  if (wordCount >= 3) indicators.push('Substantial response');
  if (gradeScore >= 70) indicators.push('Good conversational flow');
  if (indicators.length === 0) indicators.push('Basic acknowledgment');

  return {
    interestLevel: {
      score: gradeScore,
      label: getGradeLabel(gradeScore),
      indicators,
    },
    emotionalTone: {
      primary: gradeScore >= 70 ? 'Engaging' : 'Neutral',
      secondary: gradeScore >= 60 ? 'Friendly' : 'Reserved',
      confidence: 75,
    },
    stateRead: feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)],
    recommendedDirection: DIRECTION_TEMPLATES[0],
    alternativeDirections: [],
    hiddenMeanings: [],
    suggestedInterpretation: '',
    responseAdvice: '',
    analysisTimestamp: new Date().toISOString(),
    messageId: `grade-${Date.now()}`,
  };
}

// Grade user's own message for effectiveness
export async function gradeOwnMessage({
  message,
  context,
  userId,
}: IntentAnalysisRequest): Promise<IntentAnalysisResult> {
  // Check if API endpoint is configured
  const endpoint = API_ENDPOINTS.AI.GRADE_OWN_MESSAGE;
  const isEndpointConfigured =
    endpoint && !endpoint.startsWith('undefined') && endpoint.length > 20;

  if (!isEndpointConfigured) {
    console.info('Using mock message grading (API not configured)');
    await new Promise<void>(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    return generateMockMessageGrade(message.text, context);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to grade message.');
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.warn('API call failed, falling back to mock grading:', error);
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return generateMockMessageGrade(message.text, context);
  }
}

export async function analyzeMessageIntent({
  message,
  context,
  userId,
}: IntentAnalysisRequest): Promise<IntentAnalysisResult> {
  // Check if API endpoint is configured
  const endpoint = API_ENDPOINTS.AI.INTENT_ANALYSIS;
  const isEndpointConfigured =
    endpoint && !endpoint.startsWith('undefined') && endpoint.length > 20;

  if (!isEndpointConfigured) {
    console.info('Using mock intent analysis (API not configured)');
    // Simulate network delay for realistic UX
    await new Promise<void>(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
    return generateMockIntentAnalysis(message.text);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze message intent.');
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.warn('API call failed, falling back to mock analysis:', error);
    // Fallback to mock on error
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return generateMockIntentAnalysis(message.text);
  }
}
