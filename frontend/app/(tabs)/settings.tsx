import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { store, updateStore } from '@/services/store';
import { useStore } from '@/hooks/use-store';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Priority } from '@/services/types';

const PRIORITIES: { key: Priority; label: string }[] = [
  { key: 'min_cost', label: 'Минимальная цена' },
  { key: 'min_time', label: 'Минимальный срок' },
  { key: 'balanced', label: 'Сбалансированный' },
];

export default function SettingsScreen() {
  const s = useStore();
  const text = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionTitle, { color: text }]}>Макс. отклонение от срока (дней)</Text>
      <TextInput
        style={[styles.input, { color: text, borderColor: '#ccc' }]}
        value={String(s.maxDeviationDays)}
        onChangeText={v => updateStore({ maxDeviationDays: parseInt(v) || 0 })}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#999"
      />

      <Text style={[styles.sectionTitle, { color: text }]}>Макс. цена поставки (руб./т)</Text>
      <TextInput
        style={[styles.input, { color: text, borderColor: '#ccc' }]}
        value={s.maxCostPerTon != null ? String(s.maxCostPerTon) : ''}
        onChangeText={v => {
          const n = parseFloat(v);
          updateStore({ maxCostPerTon: isNaN(n) ? null : n });
        }}
        keyboardType="numeric"
        placeholder="Не ограничена"
        placeholderTextColor="#999"
      />

      <Text style={[styles.sectionTitle, { color: text }]}>Мин. запас времени (дней)</Text>
      <TextInput
        style={[styles.input, { color: text, borderColor: '#ccc' }]}
        value={String(s.timeBufferDays)}
        onChangeText={v => updateStore({ timeBufferDays: parseInt(v) || 0 })}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#999"
      />

      <Text style={[styles.sectionTitle, { color: text }]}>Приоритет оптимизации</Text>
      <View style={styles.radioGroup}>
        {PRIORITIES.map(p => (
          <Pressable
            key={p.key}
            style={[styles.radio, s.priority === p.key && styles.radioActive]}
            onPress={() => updateStore({ priority: p.key })}
          >
            <View style={[styles.radioDot, s.priority === p.key && styles.radioDotActive]} />
            <Text style={[styles.radioLabel, { color: text }]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: text }]}>Учёт сезонных коэффициентов</Text>
        <Switch
          value={s.useSeasonalCoefficients}
          onValueChange={v => updateStore({ useSeasonalCoefficients: v })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8 },
  radioGroup: { gap: 10, marginBottom: 16 },
  radio: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 },
  radioActive: {},
  radioDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#aaa' },
  radioDotActive: { borderColor: '#0a7ea4', backgroundColor: '#0a7ea4' },
  radioLabel: { fontSize: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingVertical: 8 },
  switchLabel: { fontSize: 15 },
});
