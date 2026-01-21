/**
 * Content Moderation Module
 *
 * Provides content filtering for App Store compliance (4.3, 4.8, safety).
 * Supports text moderation with extensibility for images, voice, and bios.
 */

// Main service
export {
  moderateContent,
  moderateContentSync,
  updateModerationConfig,
  isModerationEnabled,
  setModerationEnabled,
} from './contentModerationService';

// Logging
export {
  logModerationEvent,
  getModerationStats,
  clearModerationLogs,
} from './moderationLogger';

// Types
export {
  ModerationResult,
  ModerationDecision,
  ViolationCategory,
  ConfidenceLevel,
  ContentType,
  ModerationConfig,
  ModerationLogEntry,
} from './types';

// Patterns (for testing/configuration)
export {
  getAllPatterns,
  HIGH_RISK_PATTERNS,
  MEDIUM_RISK_PATTERNS,
} from './bannedPatterns';
