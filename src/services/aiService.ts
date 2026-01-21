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

// Mock consultation response generator for development/testing (Vietnamese)
function generateMockConsultation(
  question: string,
  contextMessage: string | null | undefined,
  chatHistory: ChatHistoryMessage[],
): string {
  const questionLower = question.toLowerCase();

  // Context-aware responses based on question keywords (English + Vietnamese)
  if (questionLower.includes('interest') || questionLower.includes('like') || questionLower.includes('thích') || questionLower.includes('quan tâm')) {
    return 'Dựa trên cuộc trò chuyện, họ có vẻ thật sự quan tâm đến bạn! Họ phản hồi nhanh và đặt câu hỏi - cả hai đều là dấu hiệu tốt. Giữ năng lượng tích cực và match vibe của họ nha.';
  }

  if (questionLower.includes('mean') || questionLower.includes('what') || questionLower.includes('nghĩa') || questionLower.includes('gì')) {
    const contextPart = contextMessage
      ? `Nhìn vào "${contextMessage}" - `
      : '';
    return `${contextPart}Họ đang thân thiện và giữ cuộc trò chuyện tiếp tục. Đây là dấu hiệu tốt cho thấy họ đang tương tác với bạn. Mình gợi ý là bạn nên phản hồi ấm áp và có thể hỏi họ điều gì đó.`;
  }

  if (questionLower.includes('respond') || questionLower.includes('reply') || questionLower.includes('say') || questionLower.includes('trả lời') || questionLower.includes('nói')) {
    return 'Mình gợi ý giữ nhẹ nhàng và match năng lượng của họ. Một câu trả lời casual nhưng ấm áp sẽ hợp ở đây. Bạn có thể acknowledge những gì họ nói và hỏi thêm câu hỏi để giữ dòng chảy.';
  }

  if (questionLower.includes('mood') || questionLower.includes('feel') || questionLower.includes('tone') || questionLower.includes('tâm trạng') || questionLower.includes('cảm')) {
    return 'Giọng điệu có vẻ tích cực và thân thiện! Họ đang cởi mở và tương tác, đây là dấu hiệu tuyệt vời. Mình khuyên bạn giữ mọi thứ ấm áp và vui vẻ.';
  }

  if (questionLower.includes('strategy') || questionLower.includes('approach') || questionLower.includes('advice') || questionLower.includes('chiến') || questionLower.includes('tư vấn')) {
    return 'Lời khuyên của mình: Hãy tự nhiên và match phong cách giao tiếp của họ. Họ có vẻ thoải mái với bạn, nên cứ là chính mình. Đặt câu hỏi để thể hiện sự quan tâm, và chia sẻ một chút về bản thân nữa.';
  }

  // Check if this is a follow-up question (has chat history)
  if (chatHistory.length > 0) {
    return `Tiếp tục từ điều mình đã nói - ${question.includes('?') ? 'đúng rồi, ' : ''}mình nghĩ bạn đang đi đúng hướng. Cứ tự nhiên và giữ cuộc trò chuyện cân bằng. Thể hiện sự quan tâm nhưng đừng overthink quá!`;
  }

  // Default response
  return 'Câu hỏi hay đó! Dựa trên ngữ cảnh cuộc trò chuyện, mọi thứ có vẻ đang tốt. Giữ năng lượng tích cực và là chính mình - đó là cách tiếp cận tốt nhất. Có điều gì cụ thể bạn muốn mình phân tích không?';
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
  if (hasQuestion) indicators.push('Đặt câu hỏi - tò mò về bạn');
  if (hasEmoji) indicators.push('Dùng ngôn ngữ biểu cảm');
  if (wordCount > 3) indicators.push('Đầu tư vào câu trả lời');
  if (messageLength > 30) indicators.push('Tương tác với tin nhắn chi tiết');
  if (indicators.length === 0) indicators.push('Duy trì cuộc trò chuyện');

  const tones = [
    { primary: 'Playful', secondary: 'Friendly' },
    { primary: 'Flirty', secondary: 'Interested' },
    { primary: 'Casual', secondary: 'Relaxed' },
    { primary: 'Curious', secondary: 'Engaged' },
    { primary: 'Warm', secondary: 'Open' },
  ];
  const selectedTone = tones[Math.floor(Math.random() * tones.length)];

  // Generate contextual stateRead based on message content (Vietnamese)
  const stateReadOptions = [
    `Họ có vẻ ${selectedTone.primary.toLowerCase()} và muốn kết nối. ${hasQuestion ? 'Câu hỏi cho thấy họ muốn có bạn trong đó.' : 'Giữ đà nhé!'}`,
    `Thể hiện sự quan tâm rõ ràng muốn gặp gỡ. Giọng điệu ${selectedTone.primary.toLowerCase()} và thu hút.`,
    `Họ đang chủ động và duy trì cuộc trò chuyện. ${interestScore >= 60 ? 'Dấu hiệu tốt của sự quan tâm thật sự!' : 'Trả lời để giữ nhịp nha.'}`,
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
        'Thể hiện nhiệt tình match năng lượng của họ và cho thấy sự quan tâm rõ ràng',
        'Sự hào hứng lan tỏa - làm họ cảm thấy vui về kế hoạch',
        'Phản hồi năng lượng cao tạo sự mong đợi cho cuộc gặp',
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
        'Hỏi chi tiết cho thấy bạn quan tâm muốn thực hiện được',
        'Nắm rõ cụ thể giúp lên kế hoạch tốt hơn và thể hiện sự đầu tư',
        'Câu hỏi giữ cuộc trò chuyện tiếp tục và thể hiện sự tương tác',
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
        'Trêu đùa vui vẻ tạo chemistry và giữ mọi thứ thú vị',
        'Hài hước nhẹ nhàng thể hiện sự tự tin và cá tính',
        'Trêu ghẹo tạo tension tích cực',
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
        'Phản hồi ấm áp làm họ cảm thấy được trân trọng',
        'Thể hiện sự quan tâm thật sự xây dựng kết nối cảm xúc',
        'Giọng điệu tình cảm làm sâu thêm mối quan hệ giữa hai người',
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
        'Đề xuất thay thế cho thấy bạn muốn thực hiện được',
        'Linh hoạt nhưng vẫn có ý kiến riêng thể hiện sự trưởng thành',
        'Đưa ra lựa chọn giữ cuộc trò chuyện hiệu quả',
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
        'Match phong cách giao tiếp của họ tạo sự đồng điệu',
        'Phản chiếu năng lượng làm họ cảm thấy được hiểu',
        'Đồng ý đơn giản khi phù hợp cho thấy hai người cùng một nhịp',
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
        'Thể hiện sự quan tâm trực tiếp cho thấy sự tự tin',
        'Nói rằng bạn muốn gặp họ làm họ cảm thấy đặc biệt',
        'Tín hiệu quan tâm rõ ràng và hấp dẫn',
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
        'Phản hồi nhẹ nhàng tránh việc tỏ ra quá mạnh mẽ',
        'Năng lượng low-key có thể hấp dẫn - không desperate',
        'Đôi khi ít hơn lại là nhiều hơn trong hội thoại',
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

  // Generate feedback based on message characteristics (Vietnamese)
  const feedbackOptions: string[] = [];

  if (gradeScore >= 80) {
    feedbackOptions.push(
      'Trả lời hay lắm! Rõ ràng, ấm áp và thu hút. Giữ được nhịp trò chuyện tự nhiên.',
      'Tin nhắn chắc tay! Thể hiện sự quan tâm mà vẫn thoải mái. Cân bằng tốt.',
      'Được đó! Tin nhắn thân thiện và mời gọi mà không quá lố.',
    );
  } else if (gradeScore >= 65) {
    feedbackOptions.push(
      'Trả lời ổn. Thử thêm câu hỏi để giữ họ tương tác nha.',
      'Tin nhắn tạm được. Thêm chút nhiệt tình sẽ giúp kết nối tốt hơn.',
      'Ổn rồi. Thử match năng lượng của họ hơn nha.',
    );
  } else {
    feedbackOptions.push(
      'Có thể tốt hơn. Thử thêm chút ấm áp hoặc câu hỏi tiếp theo.',
      'Hơi ngắn. Cân nhắc mở rộng để thể hiện sự quan tâm hơn.',
      'Thử tương tác nhiều hơn. Hỏi về họ hoặc chia sẻ gì đó cá nhân.',
    );
  }

  const indicators: string[] = [];
  if (hasQuestion) indicators.push('Có câu hỏi tiếp theo');
  if (hasEmoji) indicators.push('Dùng emoji biểu cảm');
  if (wordCount >= 3) indicators.push('Trả lời đầy đủ');
  if (gradeScore >= 70) indicators.push('Dòng chảy hội thoại tốt');
  if (indicators.length === 0) indicators.push('Xác nhận cơ bản');

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
