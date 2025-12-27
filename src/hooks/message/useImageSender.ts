import { useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { useMatrixClient } from '../useMatrixClient';
import { EventType, MsgType } from 'matrix-js-sdk';

export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  fileName: string;
  fileSize?: number;
}

export const useImageSender = (roomId: string | null) => {
  const { client } = useMatrixClient();
  const [isUploading, setIsUploading] = useState(false);

  const pickAndSendImage = async (): Promise<void> => {
    if (!client || !roomId) {
      throw new Error('Cannot send image: client or roomId not available');
    }

    // Launch picker
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      return; // User cancelled
    }

    const asset = result.assets[0];
    // Normalize mimetype (image/jpg -> image/jpeg)
    let mimeType = asset.type || 'image/jpeg';
    if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg';
    }

    const imageInfo: ImageInfo = {
      uri: asset.uri || '',
      width: asset.width || 0,
      height: asset.height || 0,
      mimeType,
      fileName: asset.fileName || `image_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
    };

    await uploadAndSendImage(imageInfo);
  };

  const uploadAndSendImage = async (imageInfo: ImageInfo): Promise<void> => {
    if (!client || !roomId) {
      throw new Error('Cannot send image: client or roomId not available');
    }

    setIsUploading(true);

    try {
      // Fetch the image as blob
      const response = await fetch(imageInfo.uri);
      const blob = await response.blob();

      // Upload to Matrix media repository (direct fetch - SDK adds trailing slash)
      const baseUrl = client.getHomeserverUrl();
      const accessToken = client.getAccessToken();
      const uploadUrl = `${baseUrl}/_matrix/media/v3/upload`;

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': imageInfo.mimeType,
        },
        body: blob,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Upload failed: ${uploadRes.status} ${errorText}`);
      }

      const uploadResult = await uploadRes.json();
      const contentUri = uploadResult.content_uri;

      // Send m.image message
      await client.sendEvent(roomId, EventType.RoomMessage, {
        msgtype: MsgType.Image,
        body: imageInfo.fileName,
        filename: imageInfo.fileName,
        url: contentUri,
        info: {
          w: imageInfo.width,
          h: imageInfo.height,
          mimetype: imageInfo.mimeType,
          size: imageInfo.fileSize,
        },
      } as any);
    } finally {
      setIsUploading(false);
    }
  };

  return { pickAndSendImage, isUploading };
};
