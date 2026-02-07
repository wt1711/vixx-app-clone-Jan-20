/**
 * Banned Patterns Configuration
 *
 * Centralized list of banned keywords and patterns for content moderation.
 * In production, this should be fetched from remote config/env/DB
 * to allow updates without app redeploy.
 *
 * IMPORTANT: Patterns are case-insensitive and use word boundaries
 * to avoid false positives (e.g., "grass" won't match "ass").
 */

import {
  ViolationCategory,
  ConfidenceLevel,
  ModerationDecision,
  KeywordPattern,
} from './types';

// Helper to create word-boundary regex (case-insensitive)
const wordPattern = (word: string): RegExp => new RegExp(`\\b${word}\\b`, 'i');

// Helper to create phrase pattern
const phrasePattern = (phrase: string): RegExp =>
  new RegExp(phrase.replace(/\s+/g, '\\s+'), 'i');

/**
 * HIGH-RISK PATTERNS (BLOCK immediately)
 * These are unambiguous violations that should never be allowed.
 * NOTE: More specific patterns (e.g., self-harm) must come before
 * general patterns (e.g., violence) to ensure correct categorization.
 */
export const HIGH_RISK_PATTERNS: KeywordPattern[] = [
  // Self-harm encouragement (check FIRST - more specific than general violence)
  {
    pattern: phrasePattern('kill yourself'),
    category: ViolationCategory.SELF_HARM,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },
  {
    pattern: phrasePattern('you should die'),
    category: ViolationCategory.SELF_HARM,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },

  // Sexual content - explicit
  {
    pattern: wordPattern('porn'),
    category: ViolationCategory.SEXUAL_CONTENT,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },
  {
    pattern: phrasePattern('send nudes'),
    category: ViolationCategory.SEXUAL_CONTENT,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },

  // Violence/threats
  {
    pattern: phrasePattern('kill you'),
    category: ViolationCategory.VIOLENCE_THREATS,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },
  {
    pattern: phrasePattern('gonna kill'),
    category: ViolationCategory.VIOLENCE_THREATS,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },
  {
    pattern: phrasePattern('i will hurt'),
    category: ViolationCategory.VIOLENCE_THREATS,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },

  // Hate/harassment - slurs (abbreviated for safety, expand in production)
  {
    pattern: wordPattern('n[i1]gg[ae]r?'),
    category: ViolationCategory.HATE_HARASSMENT,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },
  {
    pattern: wordPattern('f[a4]gg?[o0]t'),
    category: ViolationCategory.HATE_HARASSMENT,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },

  // Illegal activities
  {
    pattern: phrasePattern('buy drugs'),
    category: ViolationCategory.ILLEGAL_ACTIVITY,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },
  {
    pattern: phrasePattern('sell drugs'),
    category: ViolationCategory.ILLEGAL_ACTIVITY,
    confidence: ConfidenceLevel.HIGH,
    decision: ModerationDecision.BLOCK,
  },
];

/**
 * MEDIUM-RISK PATTERNS (WARN)
 * These patterns are context-dependent and may be false positives.
 * User is warned but allowed to edit and retry.
 */
export const MEDIUM_RISK_PATTERNS: KeywordPattern[] = [
  // Borderline flirting/suggestive
  {
    pattern: phrasePattern('want to see you'),
    category: ViolationCategory.SEXUAL_CONTENT,
    confidence: ConfidenceLevel.MEDIUM,
    decision: ModerationDecision.WARN,
  },
  // Mild profanity (not slurs but inappropriate)
  {
    pattern: wordPattern('f[u\\*]ck'),
    category: ViolationCategory.HATE_HARASSMENT,
    confidence: ConfidenceLevel.MEDIUM,
    decision: ModerationDecision.WARN,
  },
  {
    pattern: wordPattern('sh[i1\\*]t'),
    category: ViolationCategory.HATE_HARASSMENT,
    confidence: ConfidenceLevel.MEDIUM,
    decision: ModerationDecision.WARN,
  },
  {
    pattern: wordPattern('b[i1\\*]tch'),
    category: ViolationCategory.HATE_HARASSMENT,
    confidence: ConfidenceLevel.MEDIUM,
    decision: ModerationDecision.WARN,
  },
  {
    pattern: wordPattern('a[s\\*][s\\*]hole'),
    category: ViolationCategory.HATE_HARASSMENT,
    confidence: ConfidenceLevel.MEDIUM,
    decision: ModerationDecision.WARN,
  },

  // Spam patterns
  {
    pattern: phrasePattern('click here'),
    category: ViolationCategory.SPAM_SCAM,
    confidence: ConfidenceLevel.MEDIUM,
    decision: ModerationDecision.WARN,
  },
  {
    pattern: phrasePattern('free money'),
    category: ViolationCategory.SPAM_SCAM,
    confidence: ConfidenceLevel.MEDIUM,
    decision: ModerationDecision.WARN,
  },
  {
    pattern: phrasePattern('you won'),
    category: ViolationCategory.SPAM_SCAM,
    confidence: ConfidenceLevel.MEDIUM,
    decision: ModerationDecision.WARN,
  },
];

/**
 * Get all patterns combined (high-risk first for priority matching)
 */
export const getAllPatterns = (): KeywordPattern[] => [
  ...HIGH_RISK_PATTERNS,
  ...MEDIUM_RISK_PATTERNS,
];

/**
 * Future: Fetch patterns from remote config
 * This allows updating the banned list without app redeploy.
 *
 * @example
 * export async function fetchRemotePatterns(): Promise<KeywordPattern[]> {
 *   const response = await fetch(API_ENDPOINTS.MODERATION.PATTERNS);
 *   const data = await response.json();
 *   return parseRemotePatterns(data);
 * }
 */
