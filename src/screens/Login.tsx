import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginInstagramModal from '../components/LoginInstagramModal';
import { InstagramIcon } from 'lucide-react-native';
import { AuthService, SystemSettingKey, SystemSettings, SystemSettingsService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function Login() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isSystemSettingsLoading, setIsSystemSettingsLoading] = useState(false);
  const authService = AuthService.getInstance();
  const [systemSettings, setSystemSettings] = useState<SystemSettings[] | undefined>(undefined);
  const systemSettingsService = SystemSettingsService.getInstance();
  const { restoreSession, matrixToken } = useAuth();

  const handleLogin = async (cookies: Record<string, string>) => {
    setIsLoading(true);
    console.log('Login with cookies:', cookies);
    const result = await authService.login(cookies);
    if (result) {
      console.log('Login successful');
      await restoreSession();
    } else {
      console.log('Login failed');
      setIsLoading(false);
      return;
    }
    setOpen(false);
    setIsLoading(false);
  };

  const handleLoginAlternative = async () => {
    setIsLoading(true);
    const settings = systemSettings?.find((setting) => setting.key === SystemSettingKey.USE_ALTERNATIVE_LOGIN_METHOD);
    if (settings && settings.value === 'true') {
      const username = systemSettings?.find((setting) => setting.key === SystemSettingKey.ALTINATIVE_LOGIN_ID)?.value;
      const password = systemSettings?.find((setting) => setting.key === SystemSettingKey.ALTINATIVE_LOGIN_PASSWORD)?.value;
      const matrixHost = systemSettings?.find((setting) => setting.key === SystemSettingKey.ALTERNATIVE_LOGIN_HOST)?.value;
      if (username && password && matrixHost) {
        const result = await authService.loginAlternative(username, password, matrixHost);
        if (result) {
          console.log('Login alternative successful');
          await restoreSession();
        } else {
          console.log('Login alternative failed');
          setIsLoading(false);
          return;
        }
      }
    }
    setIsLoading(false);
    return;
  };

  const getSystemSettings = async () => {
    setIsSystemSettingsLoading(true);
    const settings = await systemSettingsService.getSystemSettings();
    setIsSystemSettingsLoading(false);
    if (settings) {
      setSystemSettings(settings);
    }
  };

  const onLogin = async () => {
    const useAlternativeLoginMethod = systemSettings?.find((setting: SystemSettings) => setting.key === SystemSettingKey.USE_ALTERNATIVE_LOGIN_METHOD)?.value === 'true';
    if (useAlternativeLoginMethod) {
      await handleLoginAlternative();
    } else {
      setOpen(true);
    }
  };

  useEffect(() => {
    if (systemSettingsService) {
      getSystemSettings()
    }
  }, [systemSettingsService]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={[styles.loginView]} />
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Image
          source={{
            uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/90ic679nh3wp43mbosisg',
          }}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={onLogin}
            disabled={isLoading || isSystemSettingsLoading}
            activeOpacity={0.8}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <View style={styles.blurButton}>
                <InstagramIcon color={colors.text.primary} size={24} />
                <Text style={styles.buttonText}>Login with Instagram</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <LoginInstagramModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleLogin}
        isInstagramConnected={matrixToken !== null}
        isConnecting={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: '30%',
  },
  buttonContainer: {
    width: '70%',
    maxWidth: 400,
    position: 'absolute',
    top: '55%',
  },
  button: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.background.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  blurButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.transparent.white20,
    overflow: 'hidden',
    backgroundColor: colors.transparent.white10,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  loginView: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.background.black,
  },
});
