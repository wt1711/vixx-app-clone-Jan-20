import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from 'src/config';

type DashboardSectionProps = {
  title: string;
  score?: number;
  label?: string;
  indicators?: string[];
  primary?: string;
  secondary?: string;
  stats?: string;
};

export function DashboardSection({
  title,
  score,
  label,
  indicators,
  primary,
  secondary,
  stats,
}: DashboardSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {score !== undefined && (
        <View style={styles.scoreContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${score}%`,
                  backgroundColor: getScoreColor(score),
                },
              ]}
            />
          </View>
          <Text style={styles.scoreText}>
            {score}% - {label}
          </Text>
        </View>
      )}

      {indicators && indicators.length > 0 && (
        <View style={styles.indicatorsList}>
          {indicators.map((indicator, i) => (
            <Text key={i} style={styles.indicator}>
              • {indicator}
            </Text>
          ))}
        </View>
      )}

      {primary && (
        <Text style={styles.toneText}>
          Primary: <Text style={styles.toneValue}>{primary}</Text>
        </Text>
      )}

      {secondary && (
        <Text style={styles.toneText}>
          Secondary: <Text style={styles.toneValue}>{secondary}</Text>
        </Text>
      )}

      {stats && <Text style={styles.statsText}>{stats}</Text>}
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 70) return colors.accent.cyan;
  if (score >= 50) return colors.accent.instagram;
  if (score >= 30) return colors.status.warning;
  return colors.text.tertiary;
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.modal.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.modal.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scoreContainer: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.modal.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 14,
    color: colors.modal.textPrimary,
    fontWeight: '500',
  },
  indicatorsList: {
    marginTop: 8,
    gap: 4,
  },
  indicator: {
    fontSize: 13,
    color: colors.modal.textSecondary,
  },
  toneText: {
    fontSize: 14,
    color: colors.modal.textSecondary,
    marginBottom: 4,
  },
  toneValue: {
    color: colors.modal.textPrimary,
    fontWeight: '500',
  },
  statsText: {
    fontSize: 14,
    color: colors.modal.textPrimary,
  },
});
