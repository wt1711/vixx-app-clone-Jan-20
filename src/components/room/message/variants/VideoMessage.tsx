import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Video from 'react-native-video';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Play } from 'lucide-react-native';
import { MessageItem } from 'src/components/room/types';
import { styles } from 'src/components/room/message/MessageItem.styles';
import { colors } from 'src/theme';

// Cache map: videoUrl -> localVideoUri (only for iOS)
const videoCache = new Map<string, string>();

export type VideoMessageProps = {
  item: MessageItem;
  onVideoPress?: (videoUrl: string) => void;
  onLongPress?: () => void;
  textStyle: StyleProp<TextStyle>;
  isGift?: boolean;
};

export const VideoMessage = ({
  item,
  onLongPress,
  textStyle,
  isGift,
}: VideoMessageProps) => {
  const [isPlaying, setIsPlaying] = useState<boolean | undefined>(undefined);
  const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const videoStyle = useMemo<StyleProp<ViewStyle>>(() => {
    return [
      styles.messageVideo,
      styles.messageVideoWithRatio,
      { aspectRatio: 9 / 16 }, // Phone aspect ratio
    ];
  }, []);

  // Download video from item.videoUrl (iOS only)
  const downloadVideo = useCallback(async () => {
    // Only download on iOS
    if (Platform.OS !== 'ios') {
      return;
    }

    const videoUrl = item.videoUrl;

    if (!videoUrl) {
      setDownloadError('No video URL available');
      return;
    }

    // Check cache first
    const cachedUri = videoCache.get(videoUrl);
    if (cachedUri) {
      setLocalVideoUri(cachedUri);
      // Don't auto-play - video will show first frame as thumbnail
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const { config, fs } = ReactNativeBlobUtil;
      const cacheDir = fs.dirs.CacheDir;

      // Generate a unique filename from the URL
      const urlParts = videoUrl.split('/');
      let filename = urlParts[urlParts.length - 1].split('?')[0] || 'video';

      // Ensure filename has .mp4 extension
      if (
        !filename.toLowerCase().endsWith('.mp4') &&
        !filename.toLowerCase().endsWith('.mov') &&
        !filename.toLowerCase().endsWith('.m4v')
      ) {
        filename = `${filename}.mp4`;
      }

      // Create a simple hash from URL to avoid conflicts
      let urlHash = 0;
      for (let i = 0; i < videoUrl.length; i++) {
        const char = videoUrl.charCodeAt(i);
        urlHash = (urlHash * 31 + char) % 1000000;
      }
      const safeFilename = `video_${Math.abs(urlHash)}_${filename}`;
      const localPath = `${cacheDir}/${safeFilename}`;

      // Check if file already exists
      if (await fs.exists(localPath)) {
        // Use file:// prefix for iOS compatibility
        const fileUri = `file://${localPath}`;
        // Store in cache
        videoCache.set(videoUrl, fileUri);
        setLocalVideoUri(fileUri);
        setIsDownloading(false);
        // Don't auto-play - video will show first frame as thumbnail
        return;
      }

      // Download the video
      const downloadOptions: any = {
        path: localPath,
        overwrite: true,
      };

      const response = await config(downloadOptions).fetch('GET', videoUrl);

      if (response.respInfo.status === 200) {
        const finalPath = response.path();

        // Verify file exists and has content
        const fileExists = await fs.exists(finalPath);
        if (!fileExists) {
          throw new Error('Downloaded file does not exist');
        }

        const fileInfo = await fs.stat(finalPath);

        if (fileInfo.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        // Check if we got a video file
        const contentType =
          response.respInfo.headers['Content-Type'] ||
          response.respInfo.headers['content-type'] ||
          '';
        if (
          contentType &&
          !contentType.startsWith('video/') &&
          !contentType.includes('octet-stream')
        ) {
          console.warn('Warning: Content-Type is not video:', contentType);
        }

        // Use file:// prefix for iOS compatibility
        const fileUri = finalPath.startsWith('file://')
          ? finalPath
          : `file://${finalPath}`;
        // Store in cache for future use
        videoCache.set(videoUrl, fileUri);
        setLocalVideoUri(fileUri);
        // Don't auto-play - video will show first frame as thumbnail
      } else {
        throw new Error(
          `Download failed with status: ${response.respInfo.status}`,
        );
      }
    } catch (error: any) {
      console.error('Video download error:', error);
      setDownloadError(error.message || 'Failed to download video');
      setIsPlaying(false);
    } finally {
      setIsDownloading(false);
    }
  }, [item.videoUrl]);

  // Check cache on mount and auto-play if isGift
  useEffect(() => {
    const videoUrl = item.videoUrl;

    if (!videoUrl) return;

    // Only use download cache on iOS
    if (Platform.OS === 'ios') {
      // Check if we have a cached local URI
      const cachedUri = videoCache.get(videoUrl);
      if (cachedUri) {
        setLocalVideoUri(cachedUri);
        if (isGift) {
          setIsPlaying(true);
        }
        return;
      }

      // If isGift, auto-download and play
      if (isGift) {
        downloadVideo();
      }
    } else {
      // On Android, just set playing state for isGift
      if (isGift) {
        setIsPlaying(true);
      }
    }
  }, [item.videoUrl, isGift, downloadVideo]);

  const handlePress = async () => {
    if (Platform.OS === 'ios') {
      // On iOS, download first if needed
      if (!isPlaying && !localVideoUri && !isDownloading) {
        // Start download when user wants to play
        await downloadVideo();
      } else {
        setIsPlaying(!isPlaying);
      }
    } else {
      // On Android, just toggle play state
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Pressable
      style={styles.imageContainer}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      <View style={videoStyle}>
        {isDownloading ? (
          <View
            style={[StyleSheet.absoluteFill, styles.videoDownloadingOverlay]}
          >
            <ActivityIndicator size="large" color={colors.text.primary} />
            <Text style={styles.videoDownloadingText}>
              Downloading video...
            </Text>
          </View>
        ) : downloadError ? (
          <View style={[StyleSheet.absoluteFill, styles.videoErrorOverlay]}>
            <Text style={styles.videoErrorText}>{downloadError}</Text>
          </View>
        ) : localVideoUri || Platform.OS === 'android' ? (
          <>
            <Video
              source={{
                uri:
                  Platform.OS === 'ios' && localVideoUri
                    ? localVideoUri
                    : item.videoUrl || '',
              }}
              style={StyleSheet.absoluteFill}
              controls={isPlaying && !isGift}
              paused={!isPlaying}
              repeat={!isGift}
              resizeMode="cover"
              onError={(error: any) => {
                console.error('Video playback error:', error);
                setIsPlaying(false);
                setDownloadError('Playback failed');
              }}
            />
            {!isPlaying && (
              <View
                style={[StyleSheet.absoluteFill, styles.videoThumbnailOverlay]}
              >
                <View style={styles.videoPlayButton}>
                  <Play
                    size={32}
                    color={colors.text.primary}
                    fill={colors.text.primary}
                  />
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {item.videoThumbnailUrl && (
              <Image
                source={{ uri: item.videoThumbnailUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            )}
            <View
              style={[StyleSheet.absoluteFill, styles.videoThumbnailOverlay]}
            >
              <View style={styles.videoPlayButton}>
                <Play
                  size={32}
                  color={colors.text.primary}
                  fill={colors.text.primary}
                />
              </View>
              <Text style={styles.videoMessageLabel}>Tap to load</Text>
            </View>
          </>
        )}
      </View>
      {item.content === '🎥 Video' && (
        <Text style={[textStyle, styles.imageCaption]}>{item.content}</Text>
      )}
    </Pressable>
  );
};
