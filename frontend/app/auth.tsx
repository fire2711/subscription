import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Input } from '@/src/lib/ui';
import { useAuth } from '@/src/lib/auth';
import { supabase } from '@/src/lib/supabase';
import { C, F, S, R } from '@/src/lib/constants';

type Mode = 'login' | 'signup';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const router = useRouter();
  const { signInEmail, signUpEmail, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    (async () => {
      if (googleResponse?.type === 'success') {
        const idToken = (googleResponse.params as any)?.id_token;
        if (idToken) {
          setLoading(true);
          const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
          setLoading(false);
          if (error) setBanner(error.message);
          else router.replace('/(tabs)');
        }
      }
    })();
  }, [googleResponse, router]);

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!EMAIL_REGEX.test(email)) errs.email = 'Enter a valid email address';
    if (mode === 'signup') {
      if (password.length < 8 || !/\d/.test(password)) errs.password = 'Password must be at least 8 characters and contain a number';
      if (confirm !== password) errs.confirm = "Passwords don't match";
    } else if (password.length < 1) {
      errs.password = 'Password required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    setBanner(null);
    if (!validate()) return;
    setLoading(true);
    const result = mode === 'signup' ? await signUpEmail(email, password) : await signInEmail(email, password);
    setLoading(false);
    if (result.error) {
      if (mode === 'signup' && /registered|exists/i.test(result.error)) {
        setBanner('An account with this email already exists. Try logging in instead.');
      } else if (mode === 'login') {
        setBanner('Incorrect email or password');
      } else {
        setBanner(result.error);
      }
      return;
    }
    if (mode === 'signup') {
      setBanner('Account created! Check your email to confirm, then log in.');
      setMode('login');
    } else {
      router.replace('/(tabs)');
    }
  };

  const guest = async () => {
    await continueAsGuest();
    router.replace('/add-first');
  };

  return (
    <SafeAreaView style={styles.root} testID="auth-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>SubTracker</Text>

          <View style={styles.tabs}>
            <Pressable
              testID="auth-tab-login"
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Log In</Text>
            </Pressable>
            <Pressable
              testID="auth-tab-signup"
              style={[styles.tab, mode === 'signup' && styles.tabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign Up</Text>
            </Pressable>
          </View>

          {banner && (
            <View style={styles.banner} testID="auth-banner">
              <Text style={styles.bannerText}>{banner}</Text>
            </View>
          )}

          <Pressable
            testID="auth-google-btn"
            onPress={() => promptGoogle()}
            style={styles.oauthBtn}
          >
            <Ionicons name="logo-google" size={20} color={C.onSurface} />
            <Text style={styles.oauthText}>Continue with Google</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Input
            testID="auth-email-input"
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input
            testID="auth-password-input"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            placeholder={mode === 'signup' ? 'Min 8 chars, 1 number' : 'Your password'}
          />
          {mode === 'signup' && (
            <Input
              testID="auth-confirm-input"
              label="Confirm Password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              error={errors.confirm}
              placeholder="Re-enter your password"
            />
          )}

          <Button
            testID="auth-submit-btn"
            title={mode === 'signup' ? 'Sign Up' : 'Log In'}
            onPress={submit}
            loading={loading}
            style={{ marginTop: S.sm }}
          />

          {mode === 'login' && (
            <Link href="/reset-password" asChild>
              <Pressable testID="auth-forgot-link" style={{ alignSelf: 'center', marginTop: S.lg }}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
            </Link>
          )}

          <Pressable testID="auth-guest-btn" onPress={guest} style={{ alignSelf: 'center', marginTop: S.xl }}>
            <Text style={styles.linkText}>Continue as guest</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  scroll: { padding: S.lg, paddingBottom: S.xxxl },
  brand: { color: C.brand, fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: S.lg, marginBottom: S.xl, letterSpacing: -1 },
  tabs: { flexDirection: 'row', backgroundColor: C.surfaceSecondary, borderRadius: R.md, padding: 4, marginBottom: S.lg },
  tab: { flex: 1, paddingVertical: S.md, alignItems: 'center', borderRadius: R.sm },
  tabActive: { backgroundColor: C.surfaceTertiary },
  tabText: { color: C.onSurfaceSecondary, fontSize: F.lg, fontWeight: '600' },
  tabTextActive: { color: C.onSurface },
  banner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: C.error,
    borderWidth: 1,
    padding: S.md,
    borderRadius: R.md,
    marginBottom: S.md,
  },
  bannerText: { color: C.error, fontSize: F.base, lineHeight: 20 },
  oauthBtn: {
    minHeight: 52, borderRadius: R.md,
    borderWidth: 1, borderColor: C.borderStrong,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: S.md, marginBottom: S.md,
  },
  oauthText: { color: C.onSurface, fontSize: F.lg, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: S.md, gap: S.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { color: C.onSurfaceSecondary, fontSize: F.sm },
  linkText: { color: C.brand, fontSize: F.base, fontWeight: '600' },
});
