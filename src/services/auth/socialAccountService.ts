import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ACCESS_TOKEN_KEY,
  LAST_SOCIAL_ACCOUNTS_SYNC_KEY,
} from 'src/constants/localStorege';
import { API_ENDPOINTS } from 'src/constants/env';
import { HTTPError } from 'matrix-js-sdk';

export const SocialAccountType = {
  Instagram: 'instagram',
};

export type SocialAccountTypeType =
  (typeof SocialAccountType)[keyof typeof SocialAccountType];

export interface SocialAccount {
  id: string;
  userId: string;
  accountName: string;
  botRoomId: string;
  createdAt: Date;
  updatedAt: Date;
  type: SocialAccountTypeType;
  connected: boolean;
}

export class SocialAccountService {
  private static instance: SocialAccountService;
  private baseUrl = API_ENDPOINTS.SOCIAL_ACCOUNTS.BASE;
  private accessToken: string | null = null;
  public needSync: boolean | null = null;

  private constructor() {
    AsyncStorage.getItem(ACCESS_TOKEN_KEY).then(token => {
      this.accessToken = token;
    });
    AsyncStorage.getItem(LAST_SOCIAL_ACCOUNTS_SYNC_KEY).then(lastSync => {
      this.needSync = lastSync
        ? new Date(lastSync) < new Date(Date.now() - 1000 * 60 * 60 * 24)
        : false; // 24 hours
    });
  }

  public static getInstance(): SocialAccountService {
    if (!SocialAccountService.instance) {
      SocialAccountService.instance = new SocialAccountService();
    }
    return SocialAccountService.instance;
  }

  async getSocialAccounts(
    onLogout?: () => void,
  ): Promise<SocialAccount[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Loging out');
          onLogout?.();
        }
        return null;
      }
      const data = await response.json();
      return data.data as SocialAccount[];
    } catch (error) {
      console.log('Error checking social account status:', error);
      if (error instanceof HTTPError && error.httpStatus === 401) {
        onLogout?.();
      }
      return null;
    }
  }

  async syncSocialAccounts(onLogout?: () => void): Promise<boolean> {
    try {
      const response = await fetch(API_ENDPOINTS.SOCIAL_ACCOUNTS.SYNC, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Loging out');
          onLogout?.();
        }
        return false;
      }
      await AsyncStorage.setItem(
        LAST_SOCIAL_ACCOUNTS_SYNC_KEY,
        new Date().toISOString(),
      );
      this.needSync = false;
      return true;
    } catch (error) {
      console.log('Error syncing social accounts:', error);
      if (error instanceof HTTPError && error.httpStatus === 401) {
        onLogout?.();
      }
      return false;
    }
  }

  instagramAccountConnected = (data: SocialAccount[] | null) => {
    return data?.find(
      account =>
        account.type === SocialAccountType.Instagram && account.connected,
    );
  };
}
