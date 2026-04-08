import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { getApi } from '@/services/api';
import { store, updateStore } from '@/services/store';
import { useStore } from '@/hooks/use-store';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { RouteResult } from '@/services/types';

const CRITERION_LABELS: Record<string, string> = {
  min_cost: 'Мин. стоимость',
  min_time: 'Мин. срок',
  balanced: 'Сбалансированный',
  alternative: 'Альтернатива',
};

const TRANSPORT_LABELS: Record<string, string> = {
  rail: 'Ж/Д', truck: 'Авто', sea: 'Море',
  port_services: 'Порт', transit: 'Транзит', feeder: 'Фидер',
};

export default function ResultsScreen() {
  const s = useStore();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const text = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');

  const results = s.results;

  if (!results || results.routes.length === 0) {
    return (
      <View style={[styles.container, styles.empty, { backgroundColor: bg }]}>
        <Text style={[styles.emptyText, { color: text }]}>
          Нет результатов. Перейдите на вкладку «Маршрут» и нажмите «Рассчитать».
        </Text>
      </View>
    );
  }

  async function selectRoute(r: RouteResult) {
    try {
      const availableDays = Math.ceil(
        (new Date(store.deadline).getTime() - Date.now()) / 86400000
      );
      const tracking = await getApi().startTracking(r.route_id, availableDays);
      updateStore({ selectedRouteId: r.route_id, tracking });
      router.push('/(tabs)/tracking');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.rateText, { color: text }]}>Курс USD: {results.usd_rate} руб.</Text>

      {results.routes.map((r, i) => {
        const isExpanded = expanded === r.route_id;
        return (
          <View key={r.route_id} style={styles.card}>
            <Pressable onPress={() => setExpanded(isExpanded ? null : r.route_id)}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{CRITERION_LABELS[r.criterion] || r.criterion}</Text>
                </View>
                <Text style={[styles.routeName, { color: text }]}>{r.route_name}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{r.total_cost_rub.toLocaleString('ru')} руб/т</Text>
                  <Text style={styles.statLabel}>Стоимость</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{r.total_duration_days} дн.</Text>
                  <Text style={styles.statLabel}>Срок ({r.duration_min}–{r.duration_max})</Text>
                </View>
              </View>

              {r.deadline_deviation_days > 0 && (
                <Text style={styles.warning}>
                  Отклонение от дедлайна: +{r.deadline_deviation_days} дн.
                </Text>
              )}
              {r.savings_vs_cheapest > 0 && (
                <Text style={styles.savings}>
                  Переплата: +{r.savings_vs_cheapest.toLocaleString('ru')} руб/т
                </Text>
              )}
              {r.savings_vs_cheapest === 0 && i > 0 && (
                <Text style={styles.cheapest}>Самый дешёвый вариант</Text>
              )}
            </Pressable>

            {isExpanded && (
              <View style={styles.legsTable}>
                <View style={styles.legHeader}>
                  <Text style={[styles.legCell, styles.legHeaderText, { flex: 2 }]}>Этап</Text>
                  <Text style={[styles.legCell, styles.legHeaderText]}>Тип</Text>
                  <Text style={[styles.legCell, styles.legHeaderText]}>Стоимость</Text>
                  <Text style={[styles.legCell, styles.legHeaderText]}>Срок</Text>
                </View>
                {r.legs.map((leg, li) => (
                  <View key={li} style={styles.legRow}>
                    <Text style={[styles.legCell, { flex: 2, color: text }]}>
                      {leg.origin} → {leg.destination}
                    </Text>
                    <Text style={[styles.legCell, { color: text }]}>
                      {TRANSPORT_LABELS[leg.transport_type] || leg.transport_type}
                    </Text>
                    <Text style={[styles.legCell, { color: text }]}>
                      {leg.cost_per_ton} {leg.currency === 'RUB' ? 'руб' : '$'}
                    </Text>
                    <Text style={[styles.legCell, { color: text }]}>{leg.duration_days} дн.</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable style={styles.trackButton} onPress={() => selectRoute(r)}>
              <Text style={styles.trackButtonText}>Отследить груз</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center', padding: 32 },
  rateText: { fontSize: 13, marginBottom: 12, opacity: 0.6 },
  card: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 16 },
  cardHeader: { marginBottom: 12 },
  badge: { backgroundColor: '#0a7ea4', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  routeName: { fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 8 },
  stat: {},
  statValue: { fontSize: 16, fontWeight: '700', color: '#0a7ea4' },
  statLabel: { fontSize: 12, color: '#888' },
  warning: { color: '#e67e22', fontSize: 13, marginTop: 4 },
  savings: { color: '#e74c3c', fontSize: 13, marginTop: 2 },
  cheapest: { color: '#27ae60', fontSize: 13, marginTop: 2 },
  legsTable: { marginTop: 12, borderTopWidth: 1, borderColor: '#ddd', paddingTop: 8 },
  legHeader: { flexDirection: 'row', marginBottom: 4 },
  legHeaderText: { fontWeight: '600', fontSize: 12, color: '#666' },
  legRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  legCell: { flex: 1, fontSize: 13 },
  trackButton: { backgroundColor: '#27ae60', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 12 },
  trackButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
