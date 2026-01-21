/**
 * Content Moderation Service Tests
 *
 * Tests for all content filtering categories:
 * - Normal conversation → ALLOW
 * - Sexual content → BLOCK
 * - Harassment → BLOCK
 * - Borderline flirting → WARN
 * - Empty/emoji-only → ALLOW
 * - Rapid repeated violations → consistent blocking
 */

import {
  moderateContent,
  moderateContentSync,
  ModerationDecision,
  ViolationCategory,
  updateModerationConfig,
  setModerationEnabled,
} from '../index';

describe('ContentModerationService', () => {
  beforeEach(() => {
    // Reset to default config before each test
    updateModerationConfig({
      enabled: true,
      aiTimeoutMs: 200,
      failOpenForLowRisk: true,
    });
    setModerationEnabled(true);
  });

  describe('Normal Conversation - ALLOW', () => {
    it('should allow normal greeting', async () => {
      const result = await moderateContent('Hello, how are you?');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should allow polite conversation', async () => {
      const result = await moderateContent(
        "Nice to meet you! I'd love to chat more.",
      );
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should allow discussing hobbies', async () => {
      const result = await moderateContent(
        'I love hiking and photography. What are your interests?',
      );
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should allow asking about weekend plans', async () => {
      const result = await moderateContent(
        'What are you up to this weekend?',
      );
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });
  });

  describe('Empty/Emoji-Only Messages - ALLOW', () => {
    it('should allow empty message', async () => {
      const result = await moderateContent('');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should allow whitespace-only message', async () => {
      const result = await moderateContent('   ');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should allow single emoji', async () => {
      const result = await moderateContent('😊');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should allow multiple emojis', async () => {
      const result = await moderateContent('😊❤️🎉');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should allow emojis with spaces', async () => {
      const result = await moderateContent('😊 ❤️ 🎉');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });
  });

  describe('Sexual Content - BLOCK', () => {
    it('should block explicit sexual content', async () => {
      const result = await moderateContent('lets have sex');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.SEXUAL_CONTENT);
    });

    it('should block porn references', async () => {
      const result = await moderateContent('send me porn');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.SEXUAL_CONTENT);
    });

    it('should block nude requests', async () => {
      const result = await moderateContent('send nudes');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.SEXUAL_CONTENT);
    });

    it('should block naked references', async () => {
      const result = await moderateContent('want to see me naked?');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.SEXUAL_CONTENT);
    });
  });

  describe('Harassment/Hate - BLOCK', () => {
    it('should block hate speech with slurs', async () => {
      const result = await moderateContent('you are a faggot');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.HATE_HARASSMENT);
    });

    it('should block racial slurs', async () => {
      const result = await moderateContent('stupid nigger');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.HATE_HARASSMENT);
    });
  });

  describe('Violence/Threats - BLOCK', () => {
    it('should block death threats', async () => {
      const result = await moderateContent('I will kill you');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.VIOLENCE_THREATS);
    });

    it('should block hurt threats', async () => {
      const result = await moderateContent('I will hurt you badly');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.VIOLENCE_THREATS);
    });
  });

  describe('Self-Harm Encouragement - BLOCK', () => {
    it('should block suicide encouragement', async () => {
      const result = await moderateContent('kill yourself');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.SELF_HARM);
    });

    it('should block death wishes', async () => {
      const result = await moderateContent('you should die');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.SELF_HARM);
    });
  });

  describe('Illegal Activities - BLOCK', () => {
    it('should block drug buying offers', async () => {
      const result = await moderateContent('want to buy drugs?');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.ILLEGAL_ACTIVITY);
    });

    it('should block drug selling offers', async () => {
      const result = await moderateContent('I can sell drugs to you');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
      expect(result.category).toBe(ViolationCategory.ILLEGAL_ACTIVITY);
    });
  });

  describe('Borderline Flirting - WARN', () => {
    it('should warn on sexy compliments', async () => {
      const result = await moderateContent('you are so sexy');
      expect(result.decision).toBe(ModerationDecision.WARN);
      expect(result.category).toBe(ViolationCategory.SEXUAL_CONTENT);
    });

    it('should warn on hot compliments', async () => {
      const result = await moderateContent('you look so hot');
      expect(result.decision).toBe(ModerationDecision.WARN);
      expect(result.category).toBe(ViolationCategory.SEXUAL_CONTENT);
    });

    it('should warn on come over invitations', async () => {
      const result = await moderateContent('why dont you come over tonight');
      expect(result.decision).toBe(ModerationDecision.WARN);
      expect(result.category).toBe(ViolationCategory.SEXUAL_CONTENT);
    });
  });

  describe('Mild Profanity - WARN', () => {
    it('should warn on fuck word', async () => {
      const result = await moderateContent('what the fuck');
      expect(result.decision).toBe(ModerationDecision.WARN);
    });

    it('should warn on shit word', async () => {
      const result = await moderateContent('oh shit');
      expect(result.decision).toBe(ModerationDecision.WARN);
    });

    it('should warn on bitch word', async () => {
      const result = await moderateContent('stop being a bitch');
      expect(result.decision).toBe(ModerationDecision.WARN);
    });
  });

  describe('Spam/Scam Patterns - WARN', () => {
    it('should warn on click here patterns', async () => {
      const result = await moderateContent('click here for free stuff');
      expect(result.decision).toBe(ModerationDecision.WARN);
      expect(result.category).toBe(ViolationCategory.SPAM_SCAM);
    });

    it('should warn on free money patterns', async () => {
      const result = await moderateContent('you can get free money');
      expect(result.decision).toBe(ModerationDecision.WARN);
      expect(result.category).toBe(ViolationCategory.SPAM_SCAM);
    });

    it('should warn on you won patterns', async () => {
      const result = await moderateContent('congratulations you won a prize');
      expect(result.decision).toBe(ModerationDecision.WARN);
      expect(result.category).toBe(ViolationCategory.SPAM_SCAM);
    });
  });

  describe('Rapid Repeated Violations - Consistent Blocking', () => {
    it('should consistently block multiple violations', async () => {
      const violations = [
        'send nudes',
        'lets have sex',
        'kill yourself',
        'I will kill you',
        'stupid nigger',
      ];

      for (const text of violations) {
        const result = await moderateContent(text);
        expect(result.decision).toBe(ModerationDecision.BLOCK);
      }
    });
  });

  describe('Sync Version', () => {
    it('should work synchronously', () => {
      const result = moderateContentSync('Hello there');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should block synchronously', () => {
      const result = moderateContentSync('send nudes');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
    });

    it('should warn synchronously', () => {
      const result = moderateContentSync('you are so sexy');
      expect(result.decision).toBe(ModerationDecision.WARN);
    });
  });

  describe('Configuration', () => {
    it('should allow everything when disabled', async () => {
      setModerationEnabled(false);

      const result = await moderateContent('send nudes');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should block again when re-enabled', async () => {
      setModerationEnabled(false);
      setModerationEnabled(true);

      const result = await moderateContent('send nudes');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
    });
  });

  describe('Case Insensitivity', () => {
    it('should detect uppercase violations', async () => {
      const result = await moderateContent('SEND NUDES');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
    });

    it('should detect mixed case violations', async () => {
      const result = await moderateContent('SeNd NuDeS');
      expect(result.decision).toBe(ModerationDecision.BLOCK);
    });
  });

  describe('Word Boundary Protection', () => {
    it('should not flag "class" (contains "ass")', async () => {
      const result = await moderateContent('I have a class at 3pm');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should not flag "Scunthorpe" problem', async () => {
      const result = await moderateContent('I live in Scunthorpe');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });

    it('should not flag "cockatoo"', async () => {
      const result = await moderateContent('I have a pet cockatoo');
      expect(result.decision).toBe(ModerationDecision.ALLOW);
    });
  });
});
