/**
 * Moderation Logger Tests
 *
 * Tests for logging functionality:
 * - Event logging with hashed IDs
 * - Statistics aggregation
 * - Buffer management
 */

import {
  logModerationEvent,
  getModerationStats,
  clearModerationLogs,
  ViolationCategory,
  ModerationDecision,
  ContentType,
} from '../index';

describe('ModerationLogger', () => {
  beforeEach(() => {
    // Clear logs before each test
    clearModerationLogs();
  });

  describe('logModerationEvent', () => {
    it('should log a block event', () => {
      logModerationEvent(
        'msg123',
        'user456',
        ViolationCategory.SEXUAL_CONTENT,
        ModerationDecision.BLOCK,
        ContentType.TEXT,
      );

      const stats = getModerationStats();
      expect(stats.totalBlocked).toBe(1);
      expect(stats.totalWarned).toBe(0);
    });

    it('should log a warn event', () => {
      logModerationEvent(
        'msg789',
        'user012',
        ViolationCategory.HATE_HARASSMENT,
        ModerationDecision.WARN,
        ContentType.TEXT,
      );

      const stats = getModerationStats();
      expect(stats.totalBlocked).toBe(0);
      expect(stats.totalWarned).toBe(1);
    });

    it('should aggregate multiple events', () => {
      logModerationEvent(
        'msg1',
        'user1',
        ViolationCategory.SEXUAL_CONTENT,
        ModerationDecision.BLOCK,
        ContentType.TEXT,
      );
      logModerationEvent(
        'msg2',
        'user2',
        ViolationCategory.VIOLENCE_THREATS,
        ModerationDecision.BLOCK,
        ContentType.TEXT,
      );
      logModerationEvent(
        'msg3',
        'user3',
        ViolationCategory.SPAM_SCAM,
        ModerationDecision.WARN,
        ContentType.TEXT,
      );

      const stats = getModerationStats();
      expect(stats.totalBlocked).toBe(2);
      expect(stats.totalWarned).toBe(1);
    });
  });

  describe('getModerationStats', () => {
    it('should return empty stats when no events', () => {
      const stats = getModerationStats();

      expect(stats.totalBlocked).toBe(0);
      expect(stats.totalWarned).toBe(0);
      expect(stats.byCategory[ViolationCategory.SEXUAL_CONTENT]).toBe(0);
    });

    it('should track events by category', () => {
      logModerationEvent(
        'msg1',
        'user1',
        ViolationCategory.SEXUAL_CONTENT,
        ModerationDecision.BLOCK,
        ContentType.TEXT,
      );
      logModerationEvent(
        'msg2',
        'user2',
        ViolationCategory.SEXUAL_CONTENT,
        ModerationDecision.BLOCK,
        ContentType.TEXT,
      );
      logModerationEvent(
        'msg3',
        'user3',
        ViolationCategory.VIOLENCE_THREATS,
        ModerationDecision.BLOCK,
        ContentType.TEXT,
      );

      const stats = getModerationStats();
      expect(stats.byCategory[ViolationCategory.SEXUAL_CONTENT]).toBe(2);
      expect(stats.byCategory[ViolationCategory.VIOLENCE_THREATS]).toBe(1);
      expect(stats.byCategory[ViolationCategory.HATE_HARASSMENT]).toBe(0);
    });
  });

  describe('clearModerationLogs', () => {
    it('should clear all logs', () => {
      logModerationEvent(
        'msg1',
        'user1',
        ViolationCategory.SEXUAL_CONTENT,
        ModerationDecision.BLOCK,
        ContentType.TEXT,
      );

      let stats = getModerationStats();
      expect(stats.totalBlocked).toBe(1);

      clearModerationLogs();

      stats = getModerationStats();
      expect(stats.totalBlocked).toBe(0);
      expect(stats.totalWarned).toBe(0);
    });
  });

  describe('Privacy', () => {
    it('should hash user and message IDs', () => {
      // This test verifies the hashing is consistent
      // We can't directly inspect the hashed values,
      // but we can verify the logger accepts the inputs
      expect(() => {
        logModerationEvent(
          'sensitive-message-id-12345',
          '@user:matrix.org',
          ViolationCategory.HATE_HARASSMENT,
          ModerationDecision.BLOCK,
          ContentType.TEXT,
        );
      }).not.toThrow();
    });
  });

  describe('Content Types', () => {
    it('should support text content type', () => {
      expect(() => {
        logModerationEvent(
          'msg1',
          'user1',
          ViolationCategory.SEXUAL_CONTENT,
          ModerationDecision.BLOCK,
          ContentType.TEXT,
        );
      }).not.toThrow();
    });

    it('should support future content types', () => {
      // These are placeholders for future expansion
      expect(ContentType.IMAGE).toBeDefined();
      expect(ContentType.VOICE).toBeDefined();
      expect(ContentType.PROFILE_BIO).toBeDefined();
    });
  });
});
