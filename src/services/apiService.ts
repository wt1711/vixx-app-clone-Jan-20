// Re-export all auth services for backwards compatibility
export { AuthService } from "./auth/authService";
export { SystemSettingsService, SystemSettingKey } from "./auth/systemSettingsService";
export type { SystemSettings, SystemSettingKeyType } from "./auth/systemSettingsService";
export { SocialAccountService, SocialAccountType } from "./auth/socialAccountService";
export type { SocialAccount, SocialAccountTypeType } from "./auth/socialAccountService";
