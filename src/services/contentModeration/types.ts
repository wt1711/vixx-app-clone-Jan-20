/**
 * Content Moderation Types
 *
 * Defines all types for the content filtering system.
 * Supports expansion for future moderation of images, voice, and profile bios.
 */

// Violation categories matching App Store guidelines 4.3, 4.8
export enum ViolationCategory {
  HATE_HARASSMENT = 'hate_harassment',
  SEXUAL_CONTENT = 'sexual_content',
  VIOLENCE_THREATS = 'violence_threats',
  SELF_HARM = 'self_harm',
  ILLEGAL_ACTIVITY = 'illegal_activity',
  SPAM_SCAM = 'spam_scam',
}

// Decision outcomes for content filtering
export enum ModerationDecision {
  ALLOW = 'allow',
  WARN = 'warn',
  BLOCK = 'block',
}

// Confidence levels for keyword matching
export enum ConfidenceLevel {
  HIGH = 'high', // Direct match with banned keywords
  MEDIUM = 'medium', // Pattern match or context-dependent
  LOW = 'low', // Requires AI classification
}

// Content type for future expansion (v2+)
export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image', // Future: image moderation
  VOICE = 'voice', // Future: voice/audio moderation
  PROFILE_BIO = 'profile_bio', // Future: profile content
}

// Result of content moderation check
export type ModerationResult = {
  decision: ModerationDecision;
  category?: ViolationCategory;
  confidence: ConfidenceLevel;
  // Internal flag - do not expose to UI
  triggeredKeyword?: string;
};

// Log entry for moderation events (internal only)
export type ModerationLogEntry = {
  messageIdHash: string;
  userIdHash: string;
  category: ViolationCategory;
  timestamp: number;
  action: ModerationDecision.WARN | ModerationDecision.BLOCK;
  contentType: ContentType;
};

// Configuration for keyword patterns
export type KeywordPattern = {
  pattern: RegExp;
  category: ViolationCategory;
  confidence: ConfidenceLevel;
  decision: ModerationDecision;
};

// Configuration for the moderation service
export type ModerationConfig = {
  enabled: boolean;
  // Timeout for AI classification (fail-safe)
  aiTimeoutMs: number;
  // Whether to fail open (allow) or closed (block) on AI timeout
  failOpenForLowRisk: boolean;
};
