import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { Search } from 'lucide-react-native';
import { colors } from '../../../theme';

const QUICK_REACTIONS = ['❤️', '😆', '😮', '😢', '😠', '👍'];

const EMOJI_CATEGORIES = {
  smileys: {
    label: 'Smileys & People',
    icon: '😀',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😙',
      '🥲',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🫡',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '🫥',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🤧',
      '🥵',
      '🥶',
      '🥴',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '🥸',
      '😎',
      '🤓',
      '🧐',
      '😕',
      '🫤',
      '😟',
      '🙁',
      '😮',
      '😯',
      '😲',
      '😳',
      '🥺',
      '🥹',
      '😦',
      '😧',
      '😨',
      '😰',
      '😥',
      '😢',
      '😭',
      '😱',
      '😖',
      '😣',
      '😞',
      '😓',
      '😩',
      '😫',
      '🥱',
      '😤',
      '😡',
      '😠',
      '🤬',
      '😈',
      '👿',
      '💀',
      '☠️',
      '💩',
      '🤡',
      '👹',
      '👺',
    ],
  },
  gestures: {
    label: 'Gestures',
    icon: '👋',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '🫱',
      '🫲',
      '🫳',
      '🫴',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🫰',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '🫵',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '🫶',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💅',
    ],
  },
  animals: {
    label: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐻‍❄️',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐽',
      '🐸',
      '🐵',
      '🙈',
      '🙉',
      '🙊',
      '🐒',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🐣',
      '🐥',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🪱',
      '🐛',
      '🦋',
      '🐌',
    ],
  },
  food: {
    label: 'Food & Drink',
    icon: '🍎',
    emojis: [
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🫐',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🫑',
      '🌽',
      '🥕',
      '🫒',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
      '🥐',
      '🥯',
      '🍞',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
    ],
  },
  activities: {
    label: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🪃',
      '🥅',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛼',
      '🛷',
      '⛸️',
      '🥌',
      '🎿',
      '⛷️',
      '🏂',
      '🪂',
      '🏋️',
      '🤼',
      '🤸',
      '⛹️',
    ],
  },
  objects: {
    label: 'Objects',
    icon: '💡',
    emojis: [
      '⌚',
      '📱',
      '📲',
      '💻',
      '⌨️',
      '🖥️',
      '🖨️',
      '🖱️',
      '🖲️',
      '💽',
      '💾',
      '💿',
      '📀',
      '📼',
      '📷',
      '📸',
      '📹',
      '🎥',
      '📽️',
      '🎞️',
      '📞',
      '☎️',
      '📟',
      '📠',
      '📺',
      '📻',
      '🎙️',
      '🎚️',
      '🎛️',
      '⏱️',
      '💡',
      '🔦',
      '🕯️',
      '🧯',
      '💰',
      '💵',
      '💴',
      '💶',
      '💷',
      '💳',
    ],
  },
  symbols: {
    label: 'Symbols',
    icon: '❤️',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❤️‍🔥',
      '❤️‍🩹',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️',
      '✝️',
      '☪️',
      '🕉️',
      '☸️',
      '✡️',
      '🔯',
      '🕎',
      '☯️',
      '☦️',
      '🛐',
      '⛎',
      '♈',
      '♉',
      '♊',
      '♋',
      '♌',
      '♍',
      '♎',
      '♏',
      '🔥',
      '💯',
      '✨',
      '🎉',
      '🎊',
      '🎈',
      '💥',
      '💫',
      '⭐',
      '🌟',
    ],
  },
};

type CategoryKey = keyof typeof EMOJI_CATEGORIES;
const CATEGORY_KEYS = Object.keys(EMOJI_CATEGORIES) as CategoryKey[];

export type EmojiPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
};

export function EmojiPickerSheet({
  visible,
  onClose,
  onSelectEmoji,
}: EmojiPickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('smileys');

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    const results: string[] = [];
    for (const category of Object.values(EMOJI_CATEGORIES)) {
      results.push(
        ...category.emojis.filter(() => {
          // Simple search - in a real app you'd search emoji names/keywords
          return category.label.toLowerCase().includes(query);
        }),
      );
    }
    return results.length > 0 ? results : null;
  }, [searchQuery]);

  const handleEmojiPress = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  const renderEmojiGrid = (emojis: string[]) => (
    <View style={styles.emojiGrid}>
      {emojis.map((emoji, index) => (
        <TouchableOpacity
          key={`${emoji}-${index}`}
          style={styles.emojiButton}
          onPress={() => handleEmojiPress(emoji)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={30}
          reducedTransparencyFallbackColor={colors.background.secondary}
        />
        <View style={styles.content}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={18} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search emojis"
              placeholderTextColor={colors.text.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>

          {/* Quick Reactions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your reactions</Text>
            <View style={styles.quickReactionsRow}>
              {QUICK_REACTIONS.map((emoji, index) => (
                <TouchableOpacity
                  key={`quick-${index}`}
                  style={styles.quickReactionButton}
                  onPress={() => handleEmojiPress(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Emoji List */}
          <ScrollView
            style={styles.emojiScrollView}
            showsVerticalScrollIndicator={false}
          >
            {filteredEmojis ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                {renderEmojiGrid(filteredEmojis)}
              </View>
            ) : (
              CATEGORY_KEYS.map(key => (
                <View key={key} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {EMOJI_CATEGORIES[key].label}
                  </Text>
                  {renderEmojiGrid(EMOJI_CATEGORIES[key].emojis)}
                </View>
              ))
            )}
          </ScrollView>

          {/* Category Tabs */}
          <View style={styles.categoryTabs}>
            {CATEGORY_KEYS.map(key => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryTab,
                  activeCategory === key && styles.categoryTabActive,
                ]}
                onPress={() => setActiveCategory(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryTabEmoji}>
                  {EMOJI_CATEGORIES[key].icon}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black60,
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingBottom: 34, // Safe area bottom
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.transparent.white30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.transparent.white10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    padding: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  quickReactionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.transparent.white10,
  },
  quickReactionEmoji: {
    fontSize: 28,
  },
  emojiScrollView: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  emojiButton: {
    width: '16.66%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.transparent.white10,
    backgroundColor: colors.transparent.white05,
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  categoryTabActive: {
    backgroundColor: colors.transparent.white15,
  },
  categoryTabEmoji: {
    fontSize: 22,
  },
});
