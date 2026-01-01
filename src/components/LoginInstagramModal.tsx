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
import { RefreshCw } from 'lucide-react-native';
import { colors, gradients } from '../theme';
import SyncingInstagramModal from './SyncingInstagramModal';

interface LoginInstagramModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (cookies: any) => void;
  isInstagramConnected: boolean;
  isConnecting: boolean;
}

const INSTAGRAM_LOGIN_URL = 'https://www.instagram.com/accounts/login/';
const INSTAGRAM_HOME_URL = 'https://www.instagram.com';

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
  const [showConnectOptions, setShowConnectOptions] = useState(false);
  const [lastParsedCookies, setLastParsedCookies] = useState('');
  const jsCookiesRef = useRef<Record<string, string>>({});

  const handleCloseWebView = () => {
    onClose();
    setSyncReady(false);
    setCookies(null);
    autoConnectAttemptedRef.current = false;
    jsCookiesRef.current = {}; // Clear JavaScript cookies ref
    setShowConnectOptions(false);
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
      // Wait for document to be ready before injecting
      webViewRef.current?.injectJavaScript(`
        (function() {
          function extractCookies() {
            try {
              var cookieStr = document.cookie || '';
              if (cookieStr) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'COOKIES', cookies: cookieStr }));
              }
            } catch (e) {
              console.error('Error extracting cookies:', e);
            }
          }
          
          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            extractCookies();
          } else {
            document.addEventListener('DOMContentLoaded', extractCookies);
            window.addEventListener('load', extractCookies);
          }
          true;
        })();
      `);

      // Also try to get all cookies including HttpOnly ones using CookieManager
      try {
        const allCookies = await CookieManager.get(INSTAGRAM_HOME_URL, true);
        console.log('All Instagram Cookies (including HttpOnly):', allCookies);

        const cookieManagerCookies = Object.fromEntries(
          Object.entries(allCookies).map(([key, value]) => [key, value.value]),
        );

        console.log(
          'All Instagram Cookies (including HttpOnly) after parsed:',
          cookieManagerCookies,
        );

        // Merge with JavaScript cookies from document.cookie (stored in ref)
        const mergedCookies = {
          ...cookieManagerCookies,
          ...jsCookiesRef.current,
        };

        // Update cookies state with all cookies
        const { isValidCookies } = validateCookiesToSync(mergedCookies);
        console.log(
          'Merged cookies (CookieManager + JavaScript):',
          mergedCookies,
        );
        console.log(
          'isValidCookies',
          isValidCookies,
          !autoConnectAttemptedRef.current,
        );

        if (isValidCookies && !autoConnectAttemptedRef.current) {
          autoConnectAttemptedRef.current = true;
          setCookies(mergedCookies);
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

    if (payload?.type === 'LOGOUT_COMPLETE') {
      console.log('Logout completed from Instagram');
      return;
    }

    if (payload?.type === 'COOKIES' && lastParsedCookies !== payload.cookies) {
      const parsed = parseCookieString(payload.cookies || '');
      setLastParsedCookies(payload.cookies || '');
      console.log('Instagram Cookies (document.cookie):', parsed);

      // Store JavaScript cookies in ref for merging
      jsCookiesRef.current = parsed;

      // Merge with existing cookies from CookieManager if available
      let newCookies = parsed;
      if (cookies && typeof cookies === 'object') {
        newCookies = { ...cookies, ...parsed };
      }
      const { isValidCookies } = validateCookiesToSync(newCookies);
      if (isValidCookies) {
        setCookies(newCookies);
      }

      // Also trigger cookie extraction from CookieManager to merge HttpOnly cookies
      setTimeout(() => {
        extractCookies();
      }, 100);
    }
  };

  const getCookieVal = (name: string, newCookies: any) => {
    const finalCookies = newCookies || cookies;
    if (!finalCookies) return undefined;
    const val = finalCookies[name];
    if (!val) return undefined;
    return typeof val === 'string' ? val : val?.value;
  };

  const parseCookieString = (cookieStr: string): Record<string, string> => {
    const parsedCookies: Record<string, string> = {};
    if (!cookieStr) return parsedCookies;

    cookieStr.split(';').forEach(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name && valueParts.length > 0) {
        parsedCookies[name] = valueParts.join('=');
      }
    });

    return parsedCookies;
  };

  const handleConnectInstagram = () => {
    onSubmit(cookies);
    setSyncReady(true);
  };

  const handleClearCacheAndLoginNewSession = async () => {
    try {
      const csrftoken = getCookieVal('csrftoken', cookies);

      // Step 1: Logout from Instagram servers first (detach session via WebView)
      // This ensures Instagram knows the session is ended before we clear cookies
      if (csrftoken && webViewRef.current) {
        // Use WebView to call logout endpoint so it uses the correct cookies
        webViewRef.current.injectJavaScript(`
          (function() {
            const csrftoken = '${csrftoken}';
            // Call Instagram logout endpoint to properly detach the session
            fetch('https://www.instagram.com/accounts/logout/', {
              method: 'POST',
              headers: {
                'X-CSRFToken': csrftoken,
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://www.instagram.com/',
              },
              credentials: 'include',
            })
            .then(() => {
              // After logout, clear cookies and redirect
              document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
              });
              // Signal that logout is complete
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGOUT_COMPLETE' }));
            })
            .catch(() => {
              // Even if logout fails, proceed with clearing
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGOUT_COMPLETE' }));
            });
            true;
          })();
        `);

        // Wait a moment for logout to complete, then proceed with clearing
        await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
      }

      // Step 2: Clear cookies from WebView via JavaScript (if not already done)
      if (!csrftoken) {
        webViewRef.current?.injectJavaScript(`
          (function() {
            document.cookie.split(";").forEach(function(c) { 
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            true;
          })();
        `);
      }

      // Step 3: Clear cookies using NitroCookies (including WebKit cookies)
      console.log('cookies', cookies);
      await Promise.all(
        Object.keys(cookies || {}).map(el =>
          CookieManager.clearByName(INSTAGRAM_HOME_URL, el, true),
        ),
      );
      await CookieManager.clearAll(true);
      await CookieManager.flush();

      // Step 4: Clear WebView cache and history
      webViewRef.current?.clearCache(true);
      webViewRef.current?.clearHistory?.();

      // Step 5: Reset state
      setShowConnectOptions(false);
      setCookies(null);
      setSyncReady(false);
      autoConnectAttemptedRef.current = false;
      jsCookiesRef.current = {}; // Clear JavaScript cookies ref
      setLastParsedCookies(''); // Reset parsed cookies state

      // Step 6: Navigate to login page
      webViewRef.current?.injectJavaScript(
        `window.location.href = "${INSTAGRAM_LOGIN_URL}";`,
      );
    } catch (error) {
      console.error('Error during logout and cache clear:', error);
      // Even if logout fails, still try to clear and redirect
      await CookieManager.clearAll(true);
      webViewRef.current?.clearCache(true);
      webViewRef.current?.injectJavaScript(
        `window.location.href = "${INSTAGRAM_LOGIN_URL}";`,
      );
      setShowConnectOptions(false);
      setCookies(null);
      setSyncReady(false);
      autoConnectAttemptedRef.current = false;
      jsCookiesRef.current = {};
    }
  };

  console.log(
    'syncReady',
    syncReady,
    'cookies',
    cookies,
    'jsCookiesRef',
    jsCookiesRef,
    'cookies && !syncReady && Object.keys(jsCookiesRef.current || {}).length > 0',
    cookies && !syncReady && Object.keys(jsCookiesRef.current || {}).length > 0,
  );

  useEffect(() => {
    if (
      cookies &&
      !syncReady &&
      Object.keys(jsCookiesRef.current || {}).length > 0
    ) {
      setShowConnectOptions(true);
    }
  }, [cookies]); // eslint-disable-line react-hooks/exhaustive-deps

  if (syncReady && isConnecting) {
    return <SyncingInstagramModal visible={open} />;
  }

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
                    {isConnecting ? 'Syncing…' : 'Sync'}
                  </Text>
                  {isConnecting ? null : (
                    <RefreshCw
                      color={colors.accent.primary}
                      size={14}
                      style={styles.syncIcon}
                    />
                  )}
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

          {showConnectOptions ? (
            <View style={styles.connectOptionsContainer}>
              <Text style={styles.connectOptionsTitle}>
                {' '}
                Account detected, please choose an option
              </Text>
              <View style={styles.connectOptionsButtonsContainer}>
                <TouchableOpacity
                  onPress={handleConnectInstagram}
                  style={styles.connectOptionsButton}
                >
                  <Text style={styles.connectOptionsButtonText}>
                    Connect by this account
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClearCacheAndLoginNewSession}
                  style={styles.connectOptionsWarningButton}
                >
                  <Text style={styles.connectOptionsButtonText}>
                    Logout and login new instagram account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <WebView
            ref={webViewRef}
            source={{ uri: INSTAGRAM_LOGIN_URL }}
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
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  closeButtonText: {
    color: colors.text.primary,
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 18,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.border.light,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  syncIcon: {
    marginLeft: 6,
  },
  extractButtonText: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
  connectOptionsContainer: {
    padding: 24,
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectOptionsButtonsContainer: {
    flexDirection: 'column',
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectOptionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: colors.text.primary,
  },
  connectOptionsButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  connectOptionsWarningButton: {
    backgroundColor: colors.status.error,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  connectOptionsButtonText: {
    color: colors.text.primary,
  },
  connectOptionsButtonTextActive: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
