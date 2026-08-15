import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LogoBadge } from '@/src/lib/ui';
import { C, F, R, S, PRESETS, Preset } from '@/src/lib/constants';

export default function AddFirst() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return PRESETS;
    return PRESETS.filter(p => p.name.toLowerCase().includes(t));
  }, [q]);

  const openWithPreset = (p: Preset) => {
    router.push({
      pathname: '/subscription-form',
      params: { preset: p.key },
    });
  };

  return (
    <SafeAreaView style={styles.root} testID="add-first-screen">
      <View style={styles.header}>
        <Pressable testID="add-first-back-btn" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={C.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Add subscription</Text>
        <Pressable testID="add-first-skip-btn" onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={C.onSurfaceSecondary} />
        <TextInput
          testID="add-first-search-input"
          placeholder="Search for a service (Netflix, Spotify...)"
          placeholderTextColor={C.onSurfaceSecondary}
          style={styles.searchInput}
          value={q}
          onChangeText={setQ}
        />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {filtered.map(p => (
          <Pressable
            key={p.key}
            testID={`preset-${p.key}`}
            style={styles.tile}
            onPress={() => openWithPreset(p)}
          >
            <LogoBadge name={p.name} color={p.color} monogram={p.monogram} size={44} />
            <Text style={styles.tileName} numberOfLines={2}>{p.name}</Text>
            <Text style={styles.tileCost}>${p.cost.toFixed(2)}/mo</Text>
          </Pressable>
        ))}
        <Pressable
          testID="add-first-custom-btn"
          style={[styles.tile, styles.customTile]}
          onPress={() => router.push('/subscription-form')}
        >
          <View style={styles.customIcon}>
            <Ionicons name="add" size={24} color={C.brand} />
          </View>
          <Text style={[styles.tileName, { color: C.brand }]}>Add Custom</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.lg },
  headerTitle: { color: C.onSurface, fontSize: F.xl, fontWeight: '700' },
  skip: { color: C.brand, fontSize: F.base, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginHorizontal: S.lg, backgroundColor: C.surfaceSecondary, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: S.md, height: 48, marginBottom: S.md },
  searchInput: { flex: 1, color: C.onSurface, fontSize: F.base },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: S.lg, gap: S.md, justifyContent: 'space-between' },
  tile: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: C.surfaceSecondary,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.sm,
    gap: 4,
  },
  tileName: { color: C.onSurface, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: S.xs },
  tileCost: { color: C.onSurfaceSecondary, fontSize: 10 },
  customTile: { borderColor: C.brand, borderStyle: 'dashed' },
  customIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brandTertiary, alignItems: 'center', justifyContent: 'center' },
});
