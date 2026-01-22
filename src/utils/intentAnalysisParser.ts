import { colors } from 'src/config';
import type {
  IntentAnalysisResult,
  ParsedIntentAnalysis,
  InterestLevelLabel,
} from 'src/types/intentAnalysis';

const INTEREST_EMOJI_MAP: Record<InterestLevelLabel, string> = {
  'Very High': '\u{1F525}', // Fire emoji
  High: '\u{1F60A}', // Smiling face
  Moderate: '\u{1F914}', // Thinking face
  Low: '\u{1F610}', // Neutral face
  Uncertain: '\u{2753}', // Question mark
};

const INTEREST_COLOR_MAP: Record<InterestLevelLabel, string> = {
  'Very High': colors.status.success,
  High: colors.accent.cyan,
  Moderate: colors.status.warning,
  Low: colors.text.secondary,
  Uncertain: colors.text.tertiary,
};

const TONE_EMOJI_MAP: Record<string, string> = {
  Playful: '\u{1F61C}', // Winking face with tongue
  Flirty: '\u{1F60F}', // Smirking face
  Serious: '\u{1F9D0}', // Face with monocle
  Casual: '\u{1F60E}', // Sunglasses face
  Nervous: '\u{1F605}', // Grinning face with sweat
  Excited: '\u{1F929}', // Star-struck face
  Friendly: '\u{1F60A}', // Smiling face
  Reserved: '\u{1F910}', // Zipper mouth face
  Romantic: '\u{1F970}', // Smiling face with hearts
  Curious: '\u{1F9D0}', // Face with monocle
  Hesitant: '\u{1F615}', // Confused face
  Confident: '\u{1F4AA}', // Flexed bicep
  Warm: '\u{1F917}', // Hugging face
  Teasing: '\u{1F61C}', // Winking face with tongue
};

export function parseIntentAnalysis(
  result: IntentAnalysisResult,
  rawResponse: string,
): ParsedIntentAnalysis {
  const interestLabel = result.interestLevel.label as InterestLevelLabel;

  return {
    ...result,
    interestLevelEmoji:
      INTEREST_EMOJI_MAP[interestLabel] || INTEREST_EMOJI_MAP.Uncertain,
    interestLevelColor:
      INTEREST_COLOR_MAP[interestLabel] || colors.text.secondary,
    emotionalToneEmoji:
      TONE_EMOJI_MAP[result.emotionalTone.primary] || '\u{1F610}',

    // Ensure actionable fields have defaults
    stateRead: result.stateRead || result.suggestedInterpretation || '',
    recommendedDirection: result.recommendedDirection || {
      label: 'Match their energy',
      tone: 'mirroring',
    },
    alternativeDirections: result.alternativeDirections || [],

    // Legacy fields for backwards compat
    recommendedResponse: result.recommendedResponse,
    alternatives: result.alternatives,

    rawResponse,
  };
}

export function getInterestLevelDescription(score: number): string {
  if (score >= 80) return 'They seem very interested in you!';
  if (score >= 60) return 'Good signs of interest here.';
  if (score >= 40) return 'Some interest, but hard to tell.';
  if (score >= 20) return 'Limited interest signals detected.';
  return 'Difficult to gauge interest level.';
}
