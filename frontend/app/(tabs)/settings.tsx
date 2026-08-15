import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/lib/auth';
import { useSubs } from '@/src/lib/subs';
import { C, F, R, S, REMINDER_OPTIONS, CURRENCIES } from '@/src/lib/constants';

export default function Settings() {
  const router = useRouter();
  const { profile, isGuest, session, isPro, reminderDays, currency, signOut, updatePrefs, setPro, deleteAccount } = useAuth();
  const { subs } = useSubs();
  const [notifStatus, setNotifStatus] = useState<string>('unknown');

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') return;
      const { status } = await Notifications.getPermissionsAsync();
      setNotifStatus(status);
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  const handleDelete = async () => {
    const r = await deleteAccount();
    if (!r.error) router.replace('/auth');
  };

  const requestNotif = async () => {
    if (Platform.OS === 'web') return;
    const { status } = await Notifications.requestPermissionsAsync();
    setNotifStatus(status);
    if (status !== 'granted') {
      Linking.openSettings();
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']} testID="settings-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: 120 }}>
        <Section title="Account">
          <Row label="Email" value={profile?.email ?? 'Guest'} />
          <Row label="Plan" value={isPro ? 'Pro' : 'Free'} accent={isPro ? C.brand : undefined} />
          <Row label="Subscriptions" value={`${subs.filter(s => s.status === 'active').length} active`} />
          {isGuest ? (
            <ActionRow testID="settings-signup-btn" label="Sign Up to Back Up Your Data" onPress={() => router.push('/auth')} />
          ) : session ? (
            <ActionRow testID="settings-logout-btn" label="Log Out" onPress={handleSignOut} />
          ) : null}
        </Section>

        <Section title="Preferences">
          <Text style={styles.subLabel}>Default reminder window</Text>
          <View style={styles.chipsRow}>
            {REMINDER_OPTIONS.map(d => (
              <Pressable
                key={d}
                testID={`reminder-${d}`}
                onPress={() => updatePrefs({ reminder_default_days: d })}
                style={[styles.chip, reminderDays === d && styles.chipActive]}
              >
                <Text style={[styles.chipText, reminderDays === d && styles.chipTextActive]}>{d} day{d === 1 ? '' : 's'} before</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.subLabel}>Default currency</Text>
          <View style={styles.chipsRow}>
            {CURRENCIES.map(c => (
              <Pressable
                key={c}
                testID={`currency-${c}`}
                onPress={() => updatePrefs({ currency_preference: c })}
                style={[styles.chip, currency === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Subscription">
          {!isPro ? (
            <ActionRow testID="settings-upgrade-btn" label="Upgrade to Pro" accent onPress={() => router.push('/paywall')} />
          ) : (
            <>
              <Row label="Current plan" value="Pro" accent={C.brand} />
              <ActionRow testID="settings-downgrade-btn" label="Downgrade to Free (mock)" onPress={() => setPro(false)} />
            </>
          )}
        </Section>

        <Section title="Notifications">
          <Row label="Permission" value={notifStatus} accent={notifStatus === 'granted' ? C.brand : C.warning} />
          {notifStatus !== 'granted' && (
            <ActionRow testID="settings-notif-btn" label="Enable Notifications" onPress={requestNotif} />
          )}
        </Section>

        <Section title="Legal">
          <ActionRow testID="settings-privacy-btn" label="Privacy Policy" onPress={() => {}} />
          <ActionRow testID="settings-tos-btn" label="Terms of Service" onPress={() => {}} />
        </Section>

        {session && (
          <Section title="Danger Zone">
            <ActionRow testID="settings-delete-btn" label="Delete Account" danger onPress={handleDelete} />
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, children }: any) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const Row = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, accent && { color: accent, fontWeight: '700' }]}>{value}</Text>
  </View>
);

const ActionRow = ({ label, onPress, testID, danger, accent }: any) => (
  <Pressable onPress={onPress} testID={testID} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
    <Text style={[styles.rowAction, danger && { color: C.error }, accent && { color: C.brand }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={danger ? C.error : accent ? C.brand : C.onSurfaceSecondary} />
  </Pressable>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { padding: S.lg, borderBottomWidth: 1, borderBottomColor: C.divider },
  title: { color: C.onSurface, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  section: { marginBottom: S.xl },
  sectionTitle: { color: C.onSurfaceSecondary, fontSize: F.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: S.sm, marginLeft: S.sm },
  card: { backgroundColor: C.surfaceSecondary, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: S.md, paddingHorizontal: S.lg, borderBottomWidth: 1, borderBottomColor: C.divider },
  rowLabel: { color: C.onSurfaceSecondary, fontSize: F.base },
  rowValue: { color: C.onSurface, fontSize: F.base, fontWeight: '600' },
  rowAction: { color: C.onSurface, fontSize: F.base, fontWeight: '600' },
  subLabel: { color: C.onSurfaceSecondary, fontSize: F.sm, marginTop: S.md, marginBottom: S.sm, marginLeft: S.lg },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, paddingHorizontal: S.md, paddingBottom: S.md },
  chip: { paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.pill, backgroundColor: C.surfaceTertiary, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.brandTertiary, borderColor: C.brand },
  chipText: { color: C.onSurfaceSecondary, fontSize: F.sm, fontWeight: '600' },
  chipTextActive: { color: C.brand },
});
