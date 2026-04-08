import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApi } from '@/services/api';
import { store, updateStore } from '@/services/store';
import { useStore } from '@/hooks/use-store';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { TrackingState } from '@/services/types';
import { MOCK_ROUTES } from '@/services/mock-data';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_transit: { label: 'В пути', color: '#0a7ea4' },
  warning: { label: 'Приближается дедлайн!', color: '#e67e22' },
  delay_alert: { label: 'Значительная задержка!', color: '#e74c3c' },
  overdue: { label: 'Просрочено', color: '#c0392b' },
  delivered: { label: 'Доставлено', color: '#27ae60' },
};

export default function TrackingScreen() {
  const s = useStore();
  const text = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [running, setRunning] = useState(false);

  const tracking = s.tracking;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!tracking) {
    return (
      <View style={[styles.container, styles.empty, { backgroundColor: bg }]}>
        <Text style={[styles.emptyText, { color: text }]}>
          Выберите маршрут на вкладке «Результаты» для начала отслеживания.
        </Text>
      </View>
    );
  }

  const route = MOCK_ROUTES.find(r => r.id === tracking.route_id);
  const totalLegs = route?.legs.length || 1;
  const statusInfo = STATUS_LABELS[tracking.status] || STATUS_LABELS.in_transit;

  function startSimulation() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(true);
    timerRef.current = setInterval(async () => {
      try {
        const next = await getApi().tickTracking(tracking!.shipment_id);
        updateStore({ tracking: next });
        if (next.status === 'delivered') {
          if (timerRef.current) clearInterval(timerRef.current);
          setRunning(false);
        }
      } catch {
        if (timerRef.current) clearInterval(timerRef.current);
        setRunning(false);
      }
    }, 1000);
  }

  function stopSimulation() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
  }

  const progress = tracking.status === 'delivered'
    ? 1
    : (tracking.current_leg_index + tracking.day_in_leg / (route?.legs[tracking.current_leg_index]?.duration_days || 1)) / totalLegs;

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
        <Text style={styles.statusText}>{statusInfo.label}</Text>
      </View>

      <Text style={[styles.label, { color: text }]}>
        Маршрут: {route?.name || tracking.route_id}
      </Text>
      <Text style={[styles.label, { color: text }]}>
        Пройдено дней: {tracking.total_elapsed_days} | Задержки: {tracking.delay_days} дн.
      </Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: statusInfo.color }]} />
        </View>
        <View style={styles.progressLabels}>
          {route?.legs.map((leg, i) => (
            <Text key={i} style={[styles.progressLabel, { color: text }]} numberOfLines={1}>
              {i <= tracking.current_leg_index ? '  ' : ''}{leg.label}
            </Text>
          ))}
        </View>
      </View>

      {/* Current leg info */}
      {tracking.status !== 'delivered' && route && tracking.current_leg_index < route.legs.length && (
        <View style={styles.currentLeg}>
          <Text style={[styles.currentLegTitle, { color: text }]}>
            Текущий этап: {route.legs[tracking.current_leg_index].label}
          </Text>
          <Text style={{ color: text }}>
            {route.legs[tracking.current_leg_index].origin} → {route.legs[tracking.current_leg_index].destination}
          </Text>
          <Text style={{ color: text }}>
            День {tracking.day_in_leg} из {route.legs[tracking.current_leg_index].duration_days}
          </Text>
        </View>
      )}

      {/* Simulation controls */}
      <View style={styles.controls}>
        {!running ? (
          <Pressable style={styles.startButton} onPress={startSimulation}>
            <Text style={styles.buttonText}>
              {tracking.status === 'delivered' ? 'Доставлено' : 'Запустить симуляцию'}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.stopButton} onPress={stopSimulation}>
            <Text style={styles.buttonText}>Остановить</Text>
          </Pressable>
        )}
      </View>

      {/* Warning alerts */}
      {(tracking.status === 'warning' || tracking.status === 'delay_alert') && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            {tracking.status === 'warning'
              ? 'До дедлайна осталось 3 дня или менее. Рекомендуем проверить альтернативные маршруты.'
              : 'Задержка превышает 2 дня. Рассмотрите альтернативный маршрут.'}
          </Text>
        </View>
      )}

      {/* History */}
      <Text style={[styles.sectionTitle, { color: text }]}>История перемещений</Text>
      {tracking.history.map((h, i) => (
        <View key={i} style={styles.historyItem}>
          <Text style={styles.historyDay}>День {h.day}</Text>
          <Text style={[styles.historyEvent, { color: text }]}>{h.event}</Text>
          <Text style={styles.historyLocation}>{h.location}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center', padding: 32 },
  statusBanner: { borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 16 },
  statusText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  label: { fontSize: 14, marginBottom: 4 },
  progressContainer: { marginVertical: 16 },
  progressBar: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressLabel: { fontSize: 10, flex: 1, textAlign: 'center' },
  currentLeg: { backgroundColor: '#f0f8ff', borderRadius: 8, padding: 12, marginBottom: 16 },
  currentLegTitle: { fontWeight: '600', marginBottom: 4 },
  controls: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  startButton: { flex: 1, backgroundColor: '#0a7ea4', borderRadius: 8, padding: 12, alignItems: 'center' },
  stopButton: { flex: 1, backgroundColor: '#e74c3c', borderRadius: 8, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  alertBox: { backgroundColor: '#fff3cd', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#e67e22' },
  alertText: { color: '#856404', fontSize: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginTop: 8, marginBottom: 8 },
  historyItem: { flexDirection: 'row', gap: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  historyDay: { fontSize: 12, color: '#0a7ea4', fontWeight: '600', width: 50 },
  historyEvent: { flex: 1, fontSize: 13 },
  historyLocation: { fontSize: 12, color: '#888', width: 80, textAlign: 'right' },
});
