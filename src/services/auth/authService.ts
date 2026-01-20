import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ACCESS_TOKEN_KEY,
  LAST_SOCIAL_ACCOUNTS_SYNC_KEY,
  MATRIX_CREDENTIALS_KEY,
} from 'src/config/localStorage';
import { API_ENDPOINTS } from 'src/config/env';

export class AuthService {
  private static instance: AuthService;
  private accessToken: string | null = null;

  private constructor() {
    AsyncStorage.getItem(ACCESS_TOKEN_KEY).then(token => {
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
          Authorization: `Bearer ${this.accessToken}`,
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
      // console.log('Login result:', responseData);
      if (!responseData.data || !responseData.data.user) {
        console.info('No user data in response', responseData);
        return false;
      }
      const result = responseData.data.user;
      this.accessToken = result.jwtToken;
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken || '');
      await AsyncStorage.setItem(
        MATRIX_CREDENTIALS_KEY,
        JSON.stringify({
          userId: result.userId,
          deviceId: result.deviceId,
          accessToken: result.accessToken,
          matrixHost: result.matrixHost,
        }),
      );
      await AsyncStorage.setItem(
        LAST_SOCIAL_ACCOUNTS_SYNC_KEY,
        new Date().toISOString(),
      );
      return true;
    } catch (error) {
      console.info('Error logging in:', error);
      return false;
    }
  }

  async loginAlternative(
    username: string,
    password: string,
    matrixHost: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN_ALTERNATIVE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          matrixHost,
        }),
      });
      if (!response.ok) {
        const error = await response.text();
        console.info('Error logging in:', error);
        return false;
      }
      const responseData = await response.json();
      // console.log('Login result:', responseData);
      if (!responseData.data || !responseData.data.user) {
        console.info('No user data in response', responseData);
        return false;
      }
      const result = responseData.data.user;
      this.accessToken = result.jwtToken;
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken || '');
      await AsyncStorage.setItem(
        MATRIX_CREDENTIALS_KEY,
        JSON.stringify({
          userId: result.userId,
          deviceId: result.deviceId,
          accessToken: result.accessToken,
          matrixHost: result.matrixHost,
        }),
      );
      await AsyncStorage.setItem(
        LAST_SOCIAL_ACCOUNTS_SYNC_KEY,
        new Date().toISOString(),
      );
      return true;
    } catch (error) {
      console.info('Error logging in:', error);
      return false;
    }
  }
}
