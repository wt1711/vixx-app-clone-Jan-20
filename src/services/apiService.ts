// Payment storage service using external service database

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN_KEY, LAST_SOCIAL_ACCOUNTS_SYNC_KEY, MATRIX_CREDENTIALS_KEY } from "../constants/localStorege";
import { API_ENDPOINTS } from "../constants/env";
import { HTTPError } from "matrix-js-sdk";

  
  export const SocialAccountType = {
    Instagram: "instagram",
  };
  
  export type SocialAccountTypeType = (typeof SocialAccountType)[keyof typeof SocialAccountType];



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
  export class AuthService {
    private static instance: AuthService;
    private accessToken: string | null = null;
  
    private constructor() {
        AsyncStorage.getItem(ACCESS_TOKEN_KEY).then((token) => {
            this.accessToken = token;
        });
    }
  
    public static getInstance(): AuthService {
      if (!AuthService.instance) {
        AuthService.instance = new AuthService();
      }
      return AuthService.instance;
    }
  
    async checkStatus(): Promise<boolean> {
      try {
        const response = await fetch(API_ENDPOINTS.AUTH.STATUS, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
        if (!response.ok) {
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error checking auth status:', error);
        return false;
      }
    }

    async login(cookies: Record<string, string>): Promise<boolean> {
      try {
        const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cookies),
        });
        if (!response.ok) {
          const error = await response.text();
          console.info('Error logging in:', error, JSON.stringify(cookies));
          return false;
        }
        const responseData = await response.json();
        console.log('Login result:', responseData);
        if (!responseData.data || !responseData.data.user) {
          console.info('No user data in response', responseData);
          return false;
        }
        const result = responseData.data.user;
        this.accessToken = result.jwtToken;
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken || '');
        await AsyncStorage.setItem(MATRIX_CREDENTIALS_KEY, JSON.stringify({
          userId: result.userId,
          deviceId: result.deviceId,
          accessToken: result.accessToken,
          matrixHost: result.matrixHost,
        }));
        await AsyncStorage.setItem(LAST_SOCIAL_ACCOUNTS_SYNC_KEY, new Date().toISOString());
        return true;
      } catch (error) {
        console.info('Error logging in:', error);
        return false;
      }
    }
  
  }
  

  export class SocialAccountService {
    private static instance: SocialAccountService;
    private baseUrl = API_ENDPOINTS.SOCIAL_ACCOUNTS.BASE;
    private accessToken: string | null = null;
    public needSync: boolean | null = null;

    private constructor() {
        AsyncStorage.getItem(ACCESS_TOKEN_KEY).then((token) => {
            this.accessToken = token;
        });
        AsyncStorage.getItem(LAST_SOCIAL_ACCOUNTS_SYNC_KEY).then((lastSync) => {
          this.needSync = lastSync ? new Date(lastSync) < new Date(Date.now() - 1000 * 60 * 60 * 24) : false; // 24 hours
        });
    }

    public static getInstance(): SocialAccountService {
      if (!SocialAccountService.instance) {
        SocialAccountService.instance = new SocialAccountService();
      }
      return SocialAccountService.instance;
    }

    async getSocialAccounts(onLogout?: () => void): Promise<SocialAccount[] | null> {
      try {
        const response = await fetch(`${this.baseUrl}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
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
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Loging out');
            onLogout?.();
          }
          return false;
        }
        AsyncStorage.setItem(LAST_SOCIAL_ACCOUNTS_SYNC_KEY, new Date().toISOString());
        this.needSync = false;
        return true;
      }
      catch (error) {
        console.log('Error syncing social accounts:', error);
        if (error instanceof HTTPError && error.httpStatus === 401) {
          onLogout?.();
        }
        return false;
      }
    }

    instagramAccountConnected = (data: SocialAccount[] | null) => {
      return data?.find((account) => account.type === SocialAccountType.Instagram && account.connected);
    }
  }
