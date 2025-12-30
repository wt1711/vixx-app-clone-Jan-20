import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import LinearGradient from 'react-native-linear-gradient';
import { gradients } from '../theme';

interface LoginInstagramModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (cookies: any) => void;
  isInstagramConnected: boolean;
  isConnecting: boolean;
}

export default function LoginInstagramModal({
  open,
  onClose,
  onSubmit,
  isInstagramConnected,
  isConnecting,
}: LoginInstagramModalProps) {
  const [cookies, setCookies] = useState<any>(null);
  const webViewRef = useRef<WebView>(null);
  const [syncReady, setSyncReady] = useState(false);
  const autoConnectAttemptedRef = useRef(false);

  const handleCloseWebView = () => {
    onClose();
  };

  const validateCookiesToSync = (newCookies?: any) => {
    const payload = {
      rur: getCookieVal('rur', newCookies) || '',
      ps_n: getCookieVal('ps_n', newCookies) || '',
      ps_l: getCookieVal('ps_l', newCookies) || '',
      ds_user_id: getCookieVal('ds_user_id', newCookies) || '',
      mid: getCookieVal('mid', newCookies) || '',
      ig_did: getCookieVal('ig_did', newCookies) || '',
      sessionid: getCookieVal('sessionid', newCookies) || '',
      datr: getCookieVal('datr', newCookies) || '',
      dpr: getCookieVal('dpr', newCookies) || '',
      wd: getCookieVal('wd', newCookies) || '',
      csrftoken: getCookieVal('csrftoken', newCookies) || '',
    };
    return {
      payload,
      isValidCookies:
        payload.ds_user_id &&
        payload.sessionid &&
        payload.rur &&
        payload.mid &&
        payload.ig_did &&
        payload.csrftoken &&
        payload.wd &&
        payload.datr,
    };
  };

  // Request cookies from the WebView via injected JavaScript (Expo Go compatible)
  const extractCookies = async () => {
    try {
      if (isInstagramConnected || !open) return;
      // First, get cookies via JavaScript (non-HttpOnly)
      webViewRef.current?.injectJavaScript(`
        (function() {
          try {
            var cookieStr = document.cookie || '';
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'COOKIES', cookies: cookieStr }));
          } catch (e) {}
          true;
        })();
      `);

      // Also try to get all cookies including HttpOnly ones using CookieManager
      try {
        const allCookies = await CookieManager.get('https://www.instagram.com');
        console.log('All Instagram Cookies (including HttpOnly):', allCookies);

        const newCookies = Object.fromEntries(
          Object.entries(allCookies).map(([key, value]) => [key, value.value]),
        );

        console.log(
          'All Instagram Cookies (including HttpOnly) after parsed:',
          newCookies,
        );

        // Update cookies state with all cookies
        const { isValidCookies } = validateCookiesToSync(newCookies);
        if (isValidCookies && !autoConnectAttemptedRef.current) {
          autoConnectAttemptedRef.current = true;
          setCookies(newCookies);
        }
      } catch (cookieError) {
        console.error('Error getting cookies with CookieManager:', cookieError);
      }
    } catch (error) {
      console.error('Error requesting cookies:', error);
      Alert.alert('Error', 'Failed to request cookies');
    }
  };

  const onNavigationStateChange = (navState: any) => {
    // Check if user is logged in by looking at the URL
    if (
      navState.url.includes('instagram.com') &&
      !navState.url.includes('login')
    ) {
      console.log('User might be logged in, URL:', navState.url);
      extractCookies();
    }
  };

  const onMessage = (event: any) => {
    const raw = event.nativeEvent.data;
    let payload: any = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      // Fallback to string message
    }

    if (raw === 'LOGIN_SUCCESS' || payload?.type === 'LOGIN_SUCCESS') {
      console.log('Login detected!');
      return;
    }

    // if (payload?.type === 'COOKIES') {
    //   const parsed = parseCookieString(payload.cookies || '');
    //   console.log('Instagram Cookies (document.cookie):', parsed);

    //   // Merge with existing cookies from CookieManager if available
    //   if (cookies && typeof cookies === 'object') {
    //     setCookies({ ...cookies, ...parsed });
    //   } else {
    //     setCookies(parsed);
    //   }
    // }
  };

  const getCookieVal = (name: string, newCookies: any) => {
    const finalCookies = newCookies || cookies;
    if (!finalCookies) return undefined;
    const val = finalCookies[name];
    if (!val) return undefined;
    return typeof val === 'string' ? val : val?.value;
  };

  const handleConnectInstagram = () => {
    onSubmit(cookies);
  };

  useEffect(() => {
    if (cookies && !syncReady) {
      console.log('handleConnectInstagram');
      handleConnectInstagram();
      setSyncReady(true);
    }
  }, [cookies]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalContainer}>
          <LinearGradient
            colors={[...gradients.screenBackground]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerCenter}>
              {syncReady ? (
                <TouchableOpacity
                  style={[
                    styles.extractButton,
                    isConnecting && styles.buttonDisabled,
                  ]}
                  onPress={handleConnectInstagram}
                  disabled={isConnecting}
                >
                  <Text style={styles.extractButtonText}>
                    {isConnecting ? 'Syncing your instagram…' : 'Sync Instagram'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseWebView}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <WebView
            ref={webViewRef}
            source={{ uri: 'https://www.instagram.com/accounts/login/' }}
            style={styles.webview}
            onNavigationStateChange={onNavigationStateChange}
            onMessage={onMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 1,
    backgroundColor: '#BDBDBD',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerSpacer: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  closeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#ff4444',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 18,
  },
  extractButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  extractButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
});
