/**
 * Content Moderation Service
 *
 * Hybrid content filtering using keyword-based detection with AI fallback.
 * Designed for App Store compliance (guidelines 4.3, 4.8, safety).
 *
 * Decision Flow:
 * 1. Check against high-risk keywords → BLOCK if match
 * 2. Check against medium-risk keywords → WARN if match
 * 3. For low-confidence matches, optionally use AI classification
 * 4. Performance target: <300ms total processing time
 *
 * Fail-safe behavior:
 * - If AI timeout: fail CLOSED for high-risk keywords, fail OPEN for low-risk
 */

import { getAllPatterns, HIGH_RISK_PATTERNS } from './bannedPatterns';
import {
  ModerationResult,
  ModerationDecision,
  ModerationConfig,
  ConfidenceLevel,
  ViolationCategory,
  KeywordPattern,
} from './types';

// Default configuration
const DEFAULT_CONFIG: ModerationConfig = {
  enabled: true,
  aiTimeoutMs: 200, // Leave room for keyword check within 300ms total
  failOpenForLowRisk: true,
};

let config: ModerationConfig = { ...DEFAULT_CONFIG };

/**
 * Update moderation configuration
 * Can be called with remote config values
 */
export function updateModerationConfig(
  newConfig: Partial<ModerationConfig>,
): void {
  config = { ...config, ...newConfig };
}

/**
 * Check if text contains only emojis or is empty
 * These are always allowed without further checks
 */
function isEmojiOnlyOrEmpty(text: string): boolean {
  if (!text || text.trim() === '') return true;

  // Regex to match emoji characters (simplified, covers most cases)
  const emojiRegex =
    /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\s]+$/u;

  return emojiRegex.test(text.trim());
}

/**
 * Check text against keyword patterns
 * Returns the first matching pattern (high-risk patterns checked first)
 */
function checkKeywordPatterns(text: string): KeywordPattern | null {
  const patterns = getAllPatterns();

  for (const pattern of patterns) {
    if (pattern.pattern.test(text)) {
      return pattern;
    }
  }

  return null;
}

/**
 * Check if text contains any high-risk keywords
 * Used for fail-closed behavior when AI is unavailable
 */
function containsHighRiskKeyword(text: string): boolean {
  return HIGH_RISK_PATTERNS.some(pattern => pattern.pattern.test(text));
}

/**
 * AI-based content classification (stub for v1)
 *
 * In production, this would call an AI moderation API (e.g., OpenAI Moderation).
 * For v1, we use keyword-only approach and leave this as a future enhancement.
 *
 * @param _text - Text to classify
 * @returns ModerationResult or null if AI is unavailable/timeout
 */
async function classifyWithAI(_text: string): Promise<ModerationResult | null> {
  // v1: AI classification is a future enhancement
  // For now, return null to indicate AI is not used
  //
  // Future implementation:
  // const response = await fetch(API_ENDPOINTS.MODERATION.CLASSIFY, {
  //   method: 'POST',
  //   body: JSON.stringify({ text }),
  //   signal: AbortSignal.timeout(config.aiTimeoutMs),
  // });
  // return response.json();

  return null;
}

/**
 * Main content moderation function
 *
 * Checks user-generated text and returns a moderation decision.
 * Must complete within 300ms for good UX.
 *
 * @param text - User-generated text content
 * @param useAI - Whether to use AI fallback for low-confidence matches
 * @returns ModerationResult with decision and category
 */
export async function moderateContent(
  text: string,
  useAI: boolean = false,
): Promise<ModerationResult> {
  // If moderation is disabled, allow everything
  if (!config.enabled) {
    return {
      decision: ModerationDecision.ALLOW,
      confidence: ConfidenceLevel.HIGH,
    };
  }

  // Allow empty or emoji-only messages without checking
  if (isEmojiOnlyOrEmpty(text)) {
    return {
      decision: ModerationDecision.ALLOW,
      confidence: ConfidenceLevel.HIGH,
    };
  }

  // Normalize text for comparison (lowercase, trim)
  const normalizedText = text.toLowerCase().trim();

  // Step 1: Check keyword patterns
  const matchedPattern = checkKeywordPatterns(normalizedText);

  if (matchedPattern) {
    return {
      decision: matchedPattern.decision,
      category: matchedPattern.category,
      confidence: matchedPattern.confidence,
      // Store for logging, but never expose to UI
      triggeredKeyword: matchedPattern.pattern.source,
    };
  }

  // Step 2: For borderline content, optionally use AI classification
  if (useAI) {
    try {
      const aiResult = await classifyWithAI(normalizedText);

      if (aiResult) {
        return aiResult;
      }

      // AI unavailable/timeout - apply fail-safe
      if (containsHighRiskKeyword(normalizedText)) {
        // Fail closed for high-risk
        return {
          decision: ModerationDecision.BLOCK,
          category: ViolationCategory.HATE_HARASSMENT, // Default category
          confidence: ConfidenceLevel.LOW,
        };
      }

      // Fail open for low-risk
      if (config.failOpenForLowRisk) {
        return {
          decision: ModerationDecision.ALLOW,
          confidence: ConfidenceLevel.LOW,
        };
      }
    } catch (error) {
      // AI error - apply fail-safe behavior
      if (__DEV__) {
        console.warn('[ContentModeration] AI classification failed:', error);
      }
    }
  }

  // No violations detected
  return {
    decision: ModerationDecision.ALLOW,
    confidence: ConfidenceLevel.HIGH,
  };
}

/**
 * Synchronous version for performance-critical paths
 * Uses keyword-only matching (no AI)
 */
export function moderateContentSync(text: string): ModerationResult {
  if (!config.enabled) {
    return {
      decision: ModerationDecision.ALLOW,
      confidence: ConfidenceLevel.HIGH,
    };
  }

  if (isEmojiOnlyOrEmpty(text)) {
    return {
      decision: ModerationDecision.ALLOW,
      confidence: ConfidenceLevel.HIGH,
    };
  }

  const normalizedText = text.toLowerCase().trim();
  const matchedPattern = checkKeywordPatterns(normalizedText);

  if (matchedPattern) {
    return {
      decision: matchedPattern.decision,
      category: matchedPattern.category,
      confidence: matchedPattern.confidence,
      triggeredKeyword: matchedPattern.pattern.source,
    };
  }

  return {
    decision: ModerationDecision.ALLOW,
    confidence: ConfidenceLevel.HIGH,
  };
}

/**
 * Check if moderation is enabled
 */
export function isModerationEnabled(): boolean {
  return config.enabled;
}

/**
 * Enable or disable moderation
 */
export function setModerationEnabled(enabled: boolean): void {
  config.enabled = enabled;
}
