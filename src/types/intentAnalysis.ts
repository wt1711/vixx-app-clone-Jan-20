/**
 * Types for the Message Intent Analysis feature
 * Used to analyze incoming messages in dating context
 */

export type InterestLevelLabel =
  | 'Very High'
  | 'High'
  | 'Moderate'
  | 'Low'
  | 'Uncertain';

export type InterestLevel = {
  score: number; // 0-100
  label: InterestLevelLabel;
  indicators: string[]; // e.g., ["Asks follow-up questions", "Uses enthusiastic language"]
};

export type EmotionalTone = {
  primary: string; // e.g., "Playful", "Flirty", "Serious", "Casual"
  secondary?: string;
  confidence: number; // 0-100
};

export type HiddenMeaning = {
  surfaceMessage: string; // What they said literally
  possibleIntent: string; // What they might mean
  context: string; // Why we think this
};

// A direction is a suggested approach/tone for responding
export type ResponseDirection = {
  label: string; // Short label e.g., "Confirm enthusiastically"
  description?: string; // Optional longer description
  tone: string; // e.g., "playful", "warm", "teasing"
  emoji?: string; // Visual indicator e.g., "🎉", "😜"
};

export type IntentAnalysisResult = {
  interestLevel: InterestLevel;
  emotionalTone: EmotionalTone;

  // Actionable output (directions-based)
  stateRead: string; // Brief interpretation (1-2 sentences)
  recommendedDirection: ResponseDirection; // Primary suggested approach
  alternativeDirections: ResponseDirection[]; // 2-3 alternative approaches

  // Legacy fields (optional, for backwards compatibility)
  hiddenMeanings?: HiddenMeaning[];
  suggestedInterpretation?: string; // 1-2 sentence summary
  responseAdvice?: string; // How to respond
  // Keep old field names for backwards compat
  recommendedResponse?: string;
  alternatives?: string[];

  analysisTimestamp: string;
  messageId: string;
};

// Result from generating a message based on a direction
export type DirectionGenerationResult = {
  message: string; // The actual message to send
  reasoning: string; // Why this message works
  emotion?: string; // Emotional tone of the response
};

export type ParsedIntentAnalysis = IntentAnalysisResult & {
  interestLevelEmoji: string;
  interestLevelColor: string;
  emotionalToneEmoji: string;
  rawResponse: string;
};

// API request/response types
export type IntentAnalysisRequest = {
  message: {
    text: string;
    sender: string;
    timestamp: string;
  };
  context: Array<{
    sender: string;
    text: string;
    timestamp: string;
    is_from_me: boolean;
  }>;
  userId?: string;
};

export type IntentAnalysisResponse = {
  success: boolean;
  analysis: IntentAnalysisResult;
  creditsUsed?: number;
};
