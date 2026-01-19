import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';
import { ParticleSparkles } from '../components/ui/ParticleSparkles';
import LoginInstagramModal from '../components/LoginInstagramModal';
import LoginCredentialsModal from '../components/LoginCredentialsModal';
import { InstagramIcon, KeyRound } from 'lucide-react-native';
import {
  AuthService,
  SystemSettingKey,
  SystemSettings,
  SystemSettingsService,
} from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { CarbonFiberTexture } from '../components/ui/NoiseTexture';

export default function Login() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isSystemSettingsLoading, setIsSystemSettingsLoading] = useState(false);
  const authService = AuthService.getInstance();
  const [systemSettings, setSystemSettings] = useState<
    SystemSettings[] | undefined
  >(undefined);
  const systemSettingsService = SystemSettingsService.getInstance();
  const { restoreSession, matrixToken } = useAuth();

  const handleLogin = async (cookies: Record<string, string>) => {
    setIsLoading(true);
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
    const settings = systemSettings?.find(
      setting => setting.key === SystemSettingKey.USE_ALTERNATIVE_LOGIN_METHOD,
    );
    if (settings && settings.value === 'true') {
      const username = systemSettings?.find(
        setting => setting.key === SystemSettingKey.ALTINATIVE_LOGIN_ID,
      )?.value;
      const password = systemSettings?.find(
        setting => setting.key === SystemSettingKey.ALTINATIVE_LOGIN_PASSWORD,
      )?.value;
      const matrixHost = systemSettings?.find(
        setting => setting.key === SystemSettingKey.ALTERNATIVE_LOGIN_HOST,
      )?.value;
      if (username && password && matrixHost) {
        const result = await authService.loginAlternative(
          username,
          password,
          matrixHost,
        );
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

  const onLogin = () => {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    setOpen(true);
  };

  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  const handleCredentialsSubmit = (username: string, password: string) => {
    const presetUsername = 'duc-admin';
    const presetPassword = '123';

    if (username === presetUsername && password === presetPassword) {
      setCredentialsError(null);
      setCredentialsModalOpen(false);
      handleLoginAlternative();
    } else {
      setCredentialsError('Invalid username or password');
    }
  };

  const handleCredentialsClose = () => {
    setCredentialsError(null);
    setCredentialsModalOpen(false);
  };

  useEffect(() => {
    if (systemSettingsService) {
      getSystemSettings();
    }
  }, [systemSettingsService]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.loginView} />
      {/* Carbon fiber weave texture */}
      <CarbonFiberTexture opacity={0.6} scale={0.5} />
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        {/* Logo with particle sparkles */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/login-screen-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ParticleSparkles
            width={180}
            height={180}
            particleCount={3}
            color={colors.transparent.white80}
          />
        </View>

        <View style={styles.buttonContainer}>
          <LiquidGlassButton
            onPress={onLogin}
            disabled={isLoading || isSystemSettingsLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <>
                <InstagramIcon color={colors.text.primary} size={24} />
                <Text style={styles.buttonText}>Login with Instagram</Text>
              </>
            )}
          </LiquidGlassButton>

          {!isLoading && (
            <LiquidGlassButton
              onPress={() => setCredentialsModalOpen(true)}
              disabled={isLoading}
            >
              <KeyRound color={colors.text.primary} size={20} />
              <Text style={styles.buttonText}>Login with Credentials</Text>
            </LiquidGlassButton>
          )}
        </View>
      </View>
      <LoginInstagramModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleLogin}
        isInstagramConnected={matrixToken !== null}
        isConnecting={isLoading}
      />
      <LoginCredentialsModal
        visible={credentialsModalOpen}
        onClose={handleCredentialsClose}
        onSubmit={handleCredentialsSubmit}
        isLoading={isLoading}
        error={credentialsError}
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
  logoContainer: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
  buttonContainer: {
    width: '70%',
    maxWidth: 400,
    position: 'absolute',
    top: '50%',
    gap: 12,
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
