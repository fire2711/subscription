import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Input } from '@/src/lib/ui';
import { useAuth } from '@/src/lib/auth';
import { C, F, S } from '@/src/lib/constants';

export default function ResetPassword() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    await resetPassword(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.root} testID="reset-password-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable testID="reset-back-btn" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={C.onSurface} />
          </Pressable>
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Enter the email tied to your account and we'll send you a reset link.</Text>
          {!sent ? (
            <>
              <Input
                testID="reset-email-input"
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
              />
              <Button testID="reset-submit-btn" title="Send Reset Link" onPress={submit} loading={loading} />
            </>
          ) : (
            <View style={styles.confirmBox} testID="reset-confirm">
              <Ionicons name="checkmark-circle" size={40} color={C.brand} />
              <Text style={styles.confirmText}>If an account exists for this email, a reset link has been sent.</Text>
              <Button title="Back to Log In" variant="ghost" onPress={() => router.replace('/auth')} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { padding: S.lg },
  body: { flex: 1, padding: S.lg },
  title: { color: C.onSurface, fontSize: 28, fontWeight: '700', marginBottom: S.sm, letterSpacing: -0.5 },
  subtitle: { color: C.onSurfaceSecondary, fontSize: F.lg, lineHeight: 22, marginBottom: S.xl },
  confirmBox: { alignItems: 'center', gap: S.lg, marginTop: S.xl },
  confirmText: { color: C.onSurface, fontSize: F.lg, textAlign: 'center', lineHeight: 22 },
});
