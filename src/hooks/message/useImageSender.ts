import { useState } from 'react';
import {
  launchImageLibrary,
  launchCamera,
  Asset,
} from 'react-native-image-picker';
import { useMatrixClient } from '../useMatrixClient';
import { EventType, MsgType } from 'matrix-js-sdk';
import ReactNativeBlobUtil from 'react-native-blob-util';

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

  const processAsset = (asset: Asset): ImageInfo => {
    let mimeType = asset.type || 'image/jpeg';
    if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg';
    }
    return {
      uri: asset.uri || '',
      width: asset.width || 0,
      height: asset.height || 0,
      mimeType,
      fileName: asset.fileName || `image_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
    };
  };

  const pickAndSendImage = async (): Promise<void> => {
    if (!client || !roomId) {
      throw new Error('Cannot send image: client or roomId not available');
    }

    const result = await launchImageLibrary({
      mediaType: 'mixed',
      quality: 0.8,
    });

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      return;
    }

    await uploadAndSendImage(processAsset(result.assets[0]));
  };

  const takeAndSendPhoto = async (): Promise<void> => {
    if (!client || !roomId) {
      throw new Error('Cannot take photo: client or roomId not available');
    }

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      cameraType: 'back',
    });

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      return;
    }

    await uploadAndSendImage(processAsset(result.assets[0]));
  };

  const uploadAndSendImage = async (imageInfo: ImageInfo): Promise<void> => {
    if (!client || !roomId) {
      throw new Error('Cannot send image: client or roomId not available');
    }

    setIsUploading(true);

    try {
      // Upload to Matrix media repository (direct fetch - SDK adds trailing slash)
      const baseUrl = client.getHomeserverUrl();
      const accessToken = client.getAccessToken();
      const uploadUrl = `${baseUrl}/_matrix/media/v3/upload`;

      const uploadRes = await ReactNativeBlobUtil.fetch(
        'POST',
        uploadUrl,
        {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': imageInfo.mimeType,
        },
        ReactNativeBlobUtil.wrap(imageInfo.uri),
      );

      if (!uploadRes.respInfo.status || uploadRes.respInfo.status !== 200) {
        const errorText = await uploadRes.text();
        throw new Error(
          `Upload failed: ${uploadRes.respInfo.status} ${errorText}`,
        );
      }

      const uploadResult = await uploadRes.json();
      const contentUri = uploadResult.content_uri;

      // Send m.image message
      await client.sendEvent(roomId, EventType.RoomMessage, {
        msgtype:
          imageInfo.mimeType === 'video/mp4' ? MsgType.Video : MsgType.Image,
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

  return { pickAndSendImage, takeAndSendPhoto, isUploading };
};
