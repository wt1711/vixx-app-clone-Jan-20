import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from 'src/config';
import type { HiddenMeaning } from 'src/types/intentAnalysis';

type IntentInsightCardProps = {
  icon: React.ReactNode;
  title: string;
  emoji?: string;
  mainValue?: string;
  mainValueColor?: string;
  secondaryValue?: string;
  confidence?: number;
  bullets?: string[];
  hiddenMeanings?: HiddenMeaning[];
};

export function IntentInsightCard({
  icon,
  title,
  emoji,
  mainValue,
  mainValueColor,
  secondaryValue,
  confidence,
  bullets,
  hiddenMeanings,
}: IntentInsightCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      {mainValue && (
        <View style={styles.mainRow}>
          {emoji && <Text style={styles.emoji}>{emoji}</Text>}
          <Text
            style={[styles.mainValue, mainValueColor && { color: mainValueColor }]}
          >
            {mainValue}
          </Text>
          {secondaryValue && (
            <Text style={styles.secondaryValue}> / {secondaryValue}</Text>
          )}
        </View>
      )}

      {confidence !== undefined && (
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceBarBg}>
            <View
              style={[styles.confidenceBarFill, { width: `${confidence}%` }]}
            />
          </View>
          <Text style={styles.confidenceText}>{confidence}% confident</Text>
        </View>
      )}

      {bullets && bullets.length > 0 && (
        <View style={styles.bulletList}>
          {bullets.map((bullet, index) => (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>{'\u2022'}</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      )}

      {hiddenMeanings &&
        hiddenMeanings.map((meaning, index) => (
          <View key={index} style={styles.meaningContainer}>
            <View style={styles.meaningRow}>
              <Text style={styles.meaningLabel}>Said:</Text>
              <Text style={styles.meaningText}>{meaning.surfaceMessage}</Text>
            </View>
            <View style={styles.meaningRow}>
              <Text style={styles.meaningLabelIntent}>Means:</Text>
              <Text style={styles.meaningTextIntent}>
                {meaning.possibleIntent}
              </Text>
            </View>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.transparent.white08,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.transparent.white10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 22,
  },
  mainValue: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  secondaryValue: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceBarBg: {
    height: 4,
    backgroundColor: colors.transparent.white10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: colors.accent.cyan,
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  bulletList: {
    marginTop: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletDot: {
    color: colors.accent.cyan,
    marginRight: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  meaningContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.transparent.white08,
  },
  meaningRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  meaningLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    width: 50,
  },
  meaningLabelIntent: {
    fontSize: 12,
    color: colors.accent.cyan,
    width: 50,
  },
  meaningText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    fontStyle: 'italic',
  },
  meaningTextIntent: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
});
