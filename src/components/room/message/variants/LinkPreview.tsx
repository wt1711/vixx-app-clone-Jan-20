import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'lucide-react-native';
import { useLinkPreview } from 'src/hooks/useLinkPreview';
import { colors } from 'src/theme';

type LinkPreviewProps = {
  url: string;
  isOwn: boolean;
  onLongPress?: () => void;
};

function getDomain(url: string): string {
  try {
    const match = url.match(/^https?:\/\/(?:www\.)?([^/]+)/i);
    return match ? match[1] : url;
  } catch {
    return url;
  }
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVideoThumbnail(url: string): string | null {
  // YouTube
  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  // Vimeo - would need API call, skip for now
  return null;
}

export const LinkPreview = React.memo<LinkPreviewProps>(
  ({ url, isOwn, onLongPress }) => {
    const { preview, loading, error } = useLinkPreview(url);

    const handlePress = () => {
      Linking.openURL(url).catch(() => {});
    };

    if (loading) {
      return (
        <View
          style={[
            styles.container,
            isOwn ? styles.containerOwn : styles.containerOther,
          ]}
        >
          <ActivityIndicator size="small" color={colors.text.secondary} />
        </View>
      );
    }

    // Fallback to video thumbnail if no images from preview
    const videoThumbnail = getVideoThumbnail(url);

    if (
      error ||
      !preview ||
      (!preview.title &&
        !preview.description &&
        !preview.images?.length &&
        !videoThumbnail)
    ) {
      return null;
    }

    const imageUrl = preview.images?.[0] || videoThumbnail;
    const domain = getDomain(url);

    return (
      <TouchableOpacity
        style={[
          styles.container,
          isOwn ? styles.containerOwn : styles.containerOther,
        ]}
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        <View style={styles.content}>
          {preview.title && (
            <Text
              style={[styles.title, isOwn ? styles.textOwn : styles.textOther]}
              numberOfLines={2}
            >
              {preview.title}
            </Text>
          )}
          {preview.description && (
            <Text
              style={[
                styles.description,
                isOwn ? styles.descOwn : styles.descOther,
              ]}
              numberOfLines={2}
            >
              {preview.description}
            </Text>
          )}
          <View style={styles.domainRow}>
            <Link size={12} color={colors.text.tertiary} />
            <Text style={styles.domain}>{domain}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

LinkPreview.displayName = 'LinkPreview';

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 280,
  },
  containerOwn: {
    backgroundColor: colors.transparent.white10,
  },
  containerOther: {
    backgroundColor: colors.transparent.white10,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  textOwn: {
    color: colors.text.messageOwn,
  },
  textOther: {
    color: colors.text.messageOther,
  },
  description: {
    fontSize: 12,
    marginBottom: 6,
  },
  descOwn: {
    color: colors.transparent.textOwnDescription,
  },
  descOther: {
    color: colors.text.secondary,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  domain: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
});
