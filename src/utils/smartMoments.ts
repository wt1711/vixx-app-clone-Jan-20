// Smart Moments - Sparse, meaningful indicators for significant conversation moments

import type { BurstAnalysisResult } from 'src/hooks/context/AIAssistantContext';

export type SmartMomentType = 'hot' | 'danger' | 'cooling' | 'depth';

export type SmartMoment = {
  type: SmartMomentType;
  emoji: string;
  label: string;
};

/**
 * Classify a burst analysis into a Smart Moment type.
 * Returns null if the burst doesn't qualify as a significant moment.
 * Most bursts should return null - we only show badges for notable events.
 */
export function classifyMoment(analysis: BurstAnalysisResult): SmartMoment | null {
  const { interestScore, sentiment, hasSubtext, messageLengthTrend, stateRead } = analysis;
  const lowerStateRead = stateRead?.toLowerCase() || '';

  // 🔥 Hot Moment - High engagement (raised threshold to be more selective)
  if (interestScore >= 80) {
    return { type: 'hot', emoji: '🔥', label: 'Hot moment' };
  }

  // 👀 Hidden Depth - Something worth exploring
  // Check both hasSubtext flag and stateRead for depth indicators
  if (hasSubtext) {
    return { type: 'depth', emoji: '👀', label: 'Worth exploring' };
  }
  const depthKeywords = ['hint', 'subtle', 'suggest', 'imply', 'between the lines', 'deeper', 'underlying', 'innuendo', 'double meaning', 'reading into', 'subtext'];
  if (depthKeywords.some(keyword => lowerStateRead.includes(keyword))) {
    return { type: 'depth', emoji: '👀', label: 'Worth exploring' };
  }

  // ⚡ Danger - Tension or challenge detected
  if (sentiment === 'tense' || sentiment === 'negative') {
    return { type: 'danger', emoji: '⚡', label: 'Handle with care' };
  }
  // Check stateRead for tension keywords
  const tensionKeywords = ['challenge', 'disagree', 'tension', 'defensive', 'pushback', 'confrontation', 'frustrated', 'upset', 'annoyed', 'cold', 'distant', 'short response', 'dismissive', 'curt'];
  if (tensionKeywords.some(keyword => lowerStateRead.includes(keyword))) {
    return { type: 'danger', emoji: '⚡', label: 'Handle with care' };
  }

  // 🧊 Cooling Off - Interest declining (adjusted thresholds)
  if (interestScore < 55) {
    // Decreasing message length is a strong signal
    if (messageLengthTrend === 'decreasing') {
      return { type: 'cooling', emoji: '🧊', label: 'Cooling off' };
    }
    // Moderate-low interest
    if (interestScore < 45) {
      return { type: 'cooling', emoji: '🧊', label: 'Cooling off' };
    }
  }

  // No significant moment - most messages should fall here
  return null;
}

/**
 * Colors associated with each moment type for UI styling
 */
export const MOMENT_COLORS: Record<SmartMomentType, string> = {
  hot: '#FF6B35',      // Warm orange
  danger: '#FFD700',   // Electric yellow
  cooling: '#4FC3F7',  // Icy blue
  depth: '#9C27B0',    // Mysterious purple
};

/**
 * Get the color for a smart moment
 */
export function getMomentColor(type: SmartMomentType): string {
  return MOMENT_COLORS[type];
}
