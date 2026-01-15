import { API_ENDPOINTS } from '../constants/env';

export type Message = {
  sender: string;
  text: string;
  timestamp: string;
  is_from_me: boolean;
};

export async function getOpenAIConsultation({
  context,
  selectedMessage,
  question,
}: {
  context: Message[];
  selectedMessage: Message;
  question?: string;
}): Promise<string> {
  try {
    const response = await fetch(API_ENDPOINTS.AI.SUGGESTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context,
        selectedMessage,
        question,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch suggestion from server.');
    }

    const data = await response.json();
    return data.suggestion;
  } catch (error) {
    console.error('Error in getOpenAIConsultation:', error);
    return 'Sorry, there was an error fetching the suggestion.';
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
      throw new Error(errorData.error || 'Failed to generate response from server.');
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
      throw new Error(errorData.error || 'Failed to generate response with idea from server.');
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
      throw new Error(errorData.error || 'Failed to grade message from server.');
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

export async function getCreditsRemaining(userId: string): Promise<CreditsInfo> {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.AI.CREDITS_REMAINING}?userId=${encodeURIComponent(userId)}`,
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
