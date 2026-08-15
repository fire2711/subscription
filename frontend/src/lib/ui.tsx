import React from 'react';
import { View, Text, StyleSheet, Pressable, PressableProps, ActivityIndicator } from 'react-native';
import { C, R, S, F } from './constants';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  title: string;
  variant?: Variant;
  loading?: boolean;
  testID?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: any;
  icon?: React.ReactNode;
};

export const Button = ({ title, variant = 'primary', loading, disabled, onPress, style, icon, testID }: ButtonProps) => {
  const bg = variant === 'primary' ? C.brand : variant === 'secondary' ? C.surfaceTertiary : variant === 'danger' ? C.error : 'transparent';
  const fg = variant === 'primary' ? C.onBrandPrimary : variant === 'danger' ? '#fff' : C.onSurface;
  const border = variant === 'ghost' ? { borderWidth: 1, borderColor: C.borderStrong } : {};
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        border,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
          {icon}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

export const Input = ({ style, ...props }: any) => (
  <View style={[styles.inputWrap, style]}>
    {props.label ? <Text style={styles.label}>{props.label}</Text> : null}
    <View style={styles.inputBox}>
      {React.createElement(require('react-native').TextInput, {
        placeholderTextColor: C.onSurfaceSecondary,
        style: styles.input,
        ...props,
      })}
    </View>
    {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}
  </View>
);

export const Card = ({ children, style }: any) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const Chip = ({ label, active, onPress, testID }: { label: string; active?: boolean; onPress?: () => void; testID?: string }) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      active ? { backgroundColor: C.brandTertiary, borderColor: C.brand } : { backgroundColor: C.surfaceSecondary, borderColor: C.border },
      pressed && { opacity: 0.8 },
    ]}
  >
    <Text style={[styles.chipText, { color: active ? C.brand : C.onSurfaceSecondary }]}>{label}</Text>
  </Pressable>
);

export const LogoBadge = ({ name, color, monogram, size = 44 }: { name?: string; color?: string; monogram?: string; size?: number }) => {
  const bg = color ?? '#3F3F46';
  const letter = monogram ?? (name?.[0]?.toUpperCase() ?? '?');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
      <Text style={{ color: '#fff', fontSize: size * 0.42, fontWeight: '700' }}>{letter}</Text>
    </View>
  );
};

export const Divider = () => <View style={{ height: 1, backgroundColor: C.divider, marginVertical: S.md }} />;

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.lg,
  },
  btnText: {
    fontSize: F.lg,
    fontWeight: '600',
  },
  inputWrap: { marginBottom: S.md },
  label: { color: C.onSurfaceSecondary, fontSize: F.sm, marginBottom: S.xs, fontWeight: '500' },
  inputBox: {
    borderRadius: R.md,
    backgroundColor: C.surfaceSecondary,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  input: { color: C.onSurface, fontSize: F.lg, paddingVertical: S.md },
  errorText: { color: C.error, fontSize: F.sm, marginTop: S.xs },
  card: {
    backgroundColor: C.surfaceSecondary,
    borderRadius: R.lg,
    padding: S.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  chip: {
    paddingHorizontal: S.md,
    height: 36,
    borderRadius: R.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipText: { fontSize: F.sm, fontWeight: '600' },
});
