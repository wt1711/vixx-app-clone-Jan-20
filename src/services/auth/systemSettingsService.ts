import { API_ENDPOINTS } from 'src/constants/env';
import { decrypt } from 'src/services/encrypt';

export enum SystemSettingKey {
  USE_ALTERNATIVE_LOGIN_METHOD = 'use_alternative_login_method',
  ALTINATIVE_LOGIN_ID = 'altinative_login_id',
  ALTINATIVE_LOGIN_PASSWORD = 'altinative_login_password',
  ALTERNATIVE_LOGIN_HOST = 'alternative_login_host',
}

export type SystemSettingKeyType =
  (typeof SystemSettingKey)[keyof typeof SystemSettingKey];

export interface SystemSettings {
  id: string;
  key: SystemSettingKeyType;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SystemSettingsService {
  private static instance: SystemSettingsService;
  private baseUrl = API_ENDPOINTS.SYSTEM_SETTINGS;

  private constructor() {}

  public static getInstance(): SystemSettingsService {
    if (!SystemSettingsService.instance) {
      SystemSettingsService.instance = new SystemSettingsService();
    }
    return SystemSettingsService.instance;
  }

  async getSystemSettings(): Promise<SystemSettings[] | null> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    let settings = data.data as SystemSettings[];
    settings = settings.map(setting => {
      const newValue = decrypt(setting.value);
      return {
        ...setting,
        value: newValue,
        originalValue: setting.value,
      };
    });
    return settings;
  }
}
