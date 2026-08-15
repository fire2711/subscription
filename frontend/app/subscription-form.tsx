import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Input, LogoBadge } from '@/src/lib/ui';
import { useSubs } from '@/src/lib/subs';
import { useAuth } from '@/src/lib/auth';
import { C, F, R, S, PRESETS, CATEGORIES, BillingCycle, Category, findPreset } from '@/src/lib/constants';

const CYCLES: { key: BillingCycle; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'custom_days', label: 'Custom' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function SubscriptionForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preset?: string; id?: string }>();
  const { add, update, remove, togglePause, subs } = useSubs();
  const { currency: defaultCurrency, isPro, isGuest, session } = useAuth();

  const editing = subs.find(s => s.id === params.id);
  const preset = params.preset ? PRESETS.find(p => p.key === params.preset) : undefined;

  const [name, setName] = useState(editing?.name ?? preset?.name ?? '');
  const [iconKey, setIconKey] = useState(editing?.icon_key ?? preset?.key ?? 'custom');
  const [cost, setCost] = useState(editing ? String(editing.cost) : preset ? String(preset.cost) : '');
  const [currency, setCurrency] = useState(editing?.currency ?? defaultCurrency);
  const [cycle, setCycle] = useState<BillingCycle>(editing?.billing_cycle ?? 'monthly');
  const [customDays, setCustomDays] = useState(editing?.custom_cycle_days ? String(editing.custom_cycle_days) : '30');
  const [renewalDate, setRenewalDate] = useState(editing?.next_renewal_date ?? todayStr());
  const [category, setCategory] = useState<Category>(editing?.category ?? preset?.category ?? 'other');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [showDate, setShowDate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [paywallReason, setPaywallReason] = useState(false);

  // Auto-match icon by name
  useEffect(() => {
    if (!editing && !preset) {
      const match = findPreset(name);
      if (match) setIconKey(match.key);
    }
  }, [name, editing, preset]);

  const iconMeta = PRESETS.find(p => p.key === iconKey);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (name.length > 60) e.name = 'Name must be 60 characters or fewer';
    const c = parseFloat(cost);
    if (!cost || isNaN(c) || c <= 0) e.cost = 'Cost must be greater than 0';
    if (cycle === 'custom_days') {
      const d = parseInt(customDays);
      if (!d || d <= 0) e.customDays = 'Days must be greater than 0';
    }
    if (renewalDate < todayStr()) e.date = 'Renewal date must be today or in the future';
    if (notes.length > 200) e.notes = 'Notes must be 200 characters or fewer';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;

    // Enforce free-tier 5-active-sub cap.
    if (!editing && !isPro) {
      const activeCount = subs.filter(s => s.status === 'active').length;
      if (activeCount >= 5) {
        setPaywallReason(true);
        return;
      }
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      icon_key: iconKey,
      cost: parseFloat(cost),
      currency,
      billing_cycle: cycle,
      custom_cycle_days: cycle === 'custom_days' ? parseInt(customDays) : null,
      next_renewal_date: renewalDate,
      category,
      status: (editing?.status ?? 'active') as any,
      notes: notes.trim() || null,
      reminder_days_override: editing?.reminder_days_override ?? null,
    };
    try {
      if (editing) {
        await update(editing.id, payload);
        router.back();
      } else {
        await add(payload);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setErrors({ form: e?.message ?? 'Could not save' });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!editing) return;
    await remove(editing.id);
    router.replace('/(tabs)');
  };

  const doPause = async () => {
    if (!editing) return;
    await togglePause(editing.id);
    router.back();
  };

  return (
    <SafeAreaView style={styles.root} testID="subscription-form">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable testID="form-cancel-btn" onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.headerLink}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{editing ? 'Edit' : 'Add'} Subscription</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.iconPreview}>
            <LogoBadge name={name || '?'} color={iconMeta?.color} monogram={iconMeta?.monogram ?? name[0]?.toUpperCase()} size={72} />
          </View>

          <Input testID="form-name-input" label="Name" value={name} onChangeText={setName} maxLength={60} error={errors.name} placeholder="Netflix" />
          <Input testID="form-cost-input" label="Cost" value={cost} onChangeText={setCost} keyboardType="decimal-pad" error={errors.cost} placeholder="15.99" />

          <Text style={styles.label}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'].map(c => (
              <Pressable key={c} testID={`form-currency-${c}`} onPress={() => setCurrency(c)} style={[styles.chip, currency === c && styles.chipActive]}>
                <Text style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Billing cycle</Text>
          <View style={styles.segmented}>
            {CYCLES.map(c => (
              <Pressable key={c.key} testID={`form-cycle-${c.key}`} onPress={() => setCycle(c.key)} style={[styles.segItem, cycle === c.key && styles.segItemActive]}>
                <Text style={[styles.segText, cycle === c.key && styles.segTextActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
          {cycle === 'custom_days' && (
            <Input testID="form-custom-days-input" label="Every ___ days" value={customDays} onChangeText={setCustomDays} keyboardType="number-pad" error={errors.customDays} />
          )}

          <Text style={styles.label}>Next renewal date</Text>
          <Pressable testID="form-date-btn" onPress={() => setShowDate(true)} style={styles.dateBtn}>
            <Text style={styles.dateText}>{renewalDate}</Text>
            <Ionicons name="calendar-outline" size={20} color={C.onSurfaceSecondary} />
          </Pressable>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          {showDate && (
            <DateTimePicker
              value={new Date(renewalDate)}
              minimumDate={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, d) => {
                setShowDate(Platform.OS === 'ios');
                if (d) setRenewalDate(d.toISOString().slice(0, 10));
              }}
              themeVariant="dark"
            />
          )}

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipsRow}>
            {CATEGORIES.map(c => (
              <Pressable key={c.key} testID={`form-cat-${c.key}`} onPress={() => setCategory(c.key)} style={[styles.chip, category === c.key && styles.chipActive]}>
                <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <Input testID="form-notes-input" label="Notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={200} error={errors.notes} style={{ marginTop: S.md }} />

          {errors.form && <Text style={styles.errorText}>{errors.form}</Text>}

          {editing && (
            <View style={{ gap: S.md, marginTop: S.lg }}>
              <Button testID="form-pause-btn" title={editing.status === 'active' ? 'Pause Subscription' : 'Resume Subscription'} variant="ghost" onPress={doPause} />
              <Button testID="form-delete-btn" title="Delete Subscription" variant="danger" onPress={doDelete} />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button testID="form-save-btn" title={editing ? 'Save Changes' : 'Add Subscription'} onPress={save} loading={saving} />
        </View>

        {isGuest && !session && (
          <View style={{ paddingHorizontal: S.lg, paddingBottom: S.md }}>
            <Text style={{ color: C.onSurfaceSecondary, textAlign: 'center', fontSize: F.sm }}>
              Guest mode — data stays on this device. Sign up to back up.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={paywallReason} transparent animationType="fade" onRequestClose={() => setPaywallReason(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Ionicons name="lock-closed" size={40} color={C.brand} />
            <Text style={styles.modalTitle}>Free plan limit reached</Text>
            <Text style={styles.modalBody}>You've hit your 5 subscription cap. Upgrade to Pro for unlimited tracking.</Text>
            <Button testID="paywall-modal-upgrade" title="Upgrade to Pro" onPress={() => { setPaywallReason(false); router.push('/paywall'); }} />
            <Button testID="paywall-modal-dismiss" title="Not now" variant="ghost" onPress={() => setPaywallReason(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.lg, borderBottomWidth: 1, borderBottomColor: C.divider },
  headerTitle: { color: C.onSurface, fontSize: F.lg, fontWeight: '700' },
  headerLink: { color: C.onSurfaceSecondary, fontSize: F.base, width: 60 },
  body: { padding: S.lg, paddingBottom: S.xxxl },
  iconPreview: { alignItems: 'center', marginBottom: S.lg },
  label: { color: C.onSurfaceSecondary, fontSize: F.sm, fontWeight: '500', marginTop: S.sm, marginBottom: S.xs },
  chipsRow: { flexDirection: 'row', gap: S.sm, paddingVertical: S.xs, flexWrap: 'wrap' },
  chip: { paddingHorizontal: S.md, height: 36, borderRadius: R.pill, backgroundColor: C.surfaceSecondary, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipActive: { backgroundColor: C.brandTertiary, borderColor: C.brand },
  chipText: { color: C.onSurfaceSecondary, fontSize: F.sm, fontWeight: '600' },
  chipTextActive: { color: C.brand },
  segmented: { flexDirection: 'row', backgroundColor: C.surfaceSecondary, borderRadius: R.md, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: S.sm, alignItems: 'center', borderRadius: R.sm },
  segItemActive: { backgroundColor: C.surfaceTertiary },
  segText: { color: C.onSurfaceSecondary, fontSize: 11, fontWeight: '600' },
  segTextActive: { color: C.onSurface },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surfaceSecondary, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: S.md, height: 52, marginBottom: S.sm },
  dateText: { color: C.onSurface, fontSize: F.lg },
  errorText: { color: C.error, fontSize: F.sm, marginTop: S.xs },
  footer: { padding: S.lg, borderTopWidth: 1, borderTopColor: C.divider },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: S.lg },
  modalCard: { backgroundColor: C.surfaceSecondary, borderRadius: R.lg, padding: S.xl, gap: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  modalTitle: { color: C.onSurface, fontSize: F.xl, fontWeight: '700', textAlign: 'center' },
  modalBody: { color: C.onSurfaceSecondary, fontSize: F.base, textAlign: 'center', marginBottom: S.sm },
});
