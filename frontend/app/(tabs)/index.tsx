import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { getApi, isUsingMock, setUseMock } from '@/services/api';
import type { Location } from '@/services/types';
import { buildRequest, store, updateStore } from '@/services/store';
import { useStore } from '@/hooks/use-store';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function RouteScreen() {
  const s = useStore();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [mock, setMock] = useState(isUsingMock());

  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  useEffect(() => {
    getApi().getLocations().then(setLocations).catch(() => {});
  }, [mock]);

  const origins = locations.filter(l => l.point_type === 'city');
  const destinations = locations.filter(l => l.point_type === 'port');

  async function calculate() {
    setLoading(true);
    try {
      const result = await getApi().optimize(buildRequest());
      updateStore({ results: result });
      router.push('/(tabs)/results');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      {/* Mock/Real switch */}
      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: text }]}>Мок-данные (офлайн)</Text>
        <Switch
          value={mock}
          onValueChange={(v) => { setUseMock(v); setMock(v); }}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: text }]}>Откуда</Text>
      <View style={styles.pickerGroup}>
        {origins.map(loc => (
          <Pressable
            key={loc.id}
            style={[styles.chip, s.originId === loc.id && styles.chipActive]}
            onPress={() => updateStore({ originId: loc.id })}
          >
            <Text style={[styles.chipText, s.originId === loc.id && styles.chipTextActive]}>
              {loc.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: text }]}>Куда</Text>
      <View style={styles.pickerGroup}>
        {destinations.map(loc => (
          <Pressable
            key={loc.id}
            style={[styles.chip, s.destinationId === loc.id && styles.chipActive]}
            onPress={() => updateStore({ destinationId: loc.id })}
          >
            <Text style={[styles.chipText, s.destinationId === loc.id && styles.chipTextActive]}>
              {loc.name} ({loc.country})
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: text }]}>Дата доставки</Text>
      <TextInput
        style={[styles.input, { color: text, borderColor: '#ccc' }]}
        value={s.deadline}
        onChangeText={(v) => updateStore({ deadline: v })}
        placeholder="ГГГГ-ММ-ДД"
        placeholderTextColor="#999"
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={calculate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Расчёт...' : 'Рассчитать маршрут'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingVertical: 8, paddingHorizontal: 4 },
  switchLabel: { fontSize: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  pickerGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e8e8e8' },
  chipActive: { backgroundColor: '#0a7ea4' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#0a7ea4', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
