// Re-export all auth services for backwards compatibility
export { AuthService } from 'src/services/auth/authService';
export {
  SystemSettingsService,
  SystemSettingKey,
} from 'src/services/auth/systemSettingsService';
export type {
  SystemSettings,
  SystemSettingKeyType,
} from 'src/services/auth/systemSettingsService';
export {
  SocialAccountService,
  SocialAccountType,
} from 'src/services/auth/socialAccountService';
export type {
  SocialAccount,
  SocialAccountTypeType,
} from 'src/services/auth/socialAccountService';
