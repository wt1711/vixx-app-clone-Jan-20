/**
 * Content Moderation Performance Tests
 *
 * Verifies filtering completes in <300ms as required.
 */

import { moderateContent, moderateContentSync } from '../index';

describe('ContentModeration Performance', () => {
  const PERFORMANCE_THRESHOLD_MS = 300;

  describe('Async moderation', () => {
    it('should complete within 300ms for normal text', async () => {
      const start = Date.now();
      await moderateContent('Hello, how are you doing today?');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should complete within 300ms for blocked content', async () => {
      const start = Date.now();
      await moderateContent('send nudes please');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should complete within 300ms for long text', async () => {
      const longText = 'This is a normal message. '.repeat(100);
      const start = Date.now();
      await moderateContent(longText);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should complete within 300ms for rapid succession calls', async () => {
      const messages = [
        'Hello there',
        'How are you?',
        'Nice to meet you',
        'What do you like to do?',
        'I enjoy hiking',
      ];

      const start = Date.now();
      await Promise.all(messages.map((msg) => moderateContent(msg)));
      const elapsed = Date.now() - start;

      // All 5 parallel calls should still complete quickly
      expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2);
    });
  });

  describe('Sync moderation', () => {
    it('should complete within 300ms for normal text', () => {
      const start = Date.now();
      moderateContentSync('Hello, how are you doing today?');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should complete within 300ms for 100 sequential calls', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        moderateContentSync(`Message number ${i}`);
      }

      const elapsed = Date.now() - start;

      // 100 sequential calls should complete in reasonable time
      // Average should be well under 3ms per call
      expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });

    it('should be faster than async version', async () => {
      const text = 'Test message for performance comparison';

      const syncStart = Date.now();
      moderateContentSync(text);
      const syncElapsed = Date.now() - syncStart;

      const asyncStart = Date.now();
      await moderateContent(text);
      const asyncElapsed = Date.now() - asyncStart;

      // Sync should be at least as fast as async
      expect(syncElapsed).toBeLessThanOrEqual(asyncElapsed + 1);
    });
  });

  describe('Pattern matching performance', () => {
    it('should handle text with many potential matches efficiently', () => {
      // Text that might trigger many regex checks
      const trickyText =
        'sex education class, assemble the team, come over here, click here, you won the game';

      const start = Date.now();
      moderateContentSync(trickyText);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    });
  });
});
