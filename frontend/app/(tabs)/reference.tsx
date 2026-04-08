import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getApi } from '@/services/api';
import type { Location, Route, PointType, CurrencyType } from '@/services/types';
import { useThemeColor } from '@/hooks/use-theme-color';

type Tab = 'locations' | 'routes';

export default function ReferenceScreen() {
  const text = useThemeColor({}, 'text');
  const bg = useThemeColor({}, 'background');
  const [tab, setTab] = useState<Tab>('locations');
  const [locations, setLocations] = useState<Location[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // New location form
  const [newName, setNewName] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newType, setNewType] = useState<PointType>('city');
  const [newCountry, setNewCountry] = useState('Россия');

  // Leg editing
  const [editingLeg, setEditingLeg] = useState<{ routeId: string; legId: string } | null>(null);
  const [legCost, setLegCost] = useState('');
  const [legCostMin, setLegCostMin] = useState('');
  const [legCostMax, setLegCostMax] = useState('');
  const [legDuration, setLegDuration] = useState('');

  useEffect(() => { reload(); }, []);

  async function reload() {
    try {
      const [locs, rts] = await Promise.all([getApi().getLocations(), getApi().getRoutes()]);
      setLocations(locs);
      setRoutes(rts);
    } catch {}
  }

  async function addLocation() {
    if (!newName || !newLat || !newLng) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    try {
      await getApi().createLocation({
        name: newName, lat: parseFloat(newLat), lng: parseFloat(newLng),
        point_type: newType, country: newCountry,
      });
      setNewName(''); setNewLat(''); setNewLng('');
      reload();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    }
  }

  async function deleteLocation(id: string) {
    try {
      await getApi().deleteLocation(id);
      reload();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    }
  }

  async function saveLeg() {
    if (!editingLeg) return;
    try {
      await getApi().updateLeg(editingLeg.routeId, editingLeg.legId, {
        ...(legCost ? { cost_per_ton: parseFloat(legCost) } : {}),
        ...(legCostMin ? { cost_min: parseFloat(legCostMin) } : {}),
        ...(legCostMax ? { cost_max: parseFloat(legCostMax) } : {}),
        ...(legDuration ? { duration_days: parseInt(legDuration) } : {}),
      });
      setEditingLeg(null);
      reload();
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === 'locations' && styles.tabActive]} onPress={() => setTab('locations')}>
          <Text style={[styles.tabText, tab === 'locations' && styles.tabTextActive]}>Точки</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'routes' && styles.tabActive]} onPress={() => setTab('routes')}>
          <Text style={[styles.tabText, tab === 'routes' && styles.tabTextActive]}>Маршруты/Ставки</Text>
        </Pressable>
      </View>

      {tab === 'locations' && (
        <>
          <Text style={[styles.sectionTitle, { color: text }]}>Добавить точку</Text>
          <TextInput style={[styles.input, { color: text }]} value={newName} onChangeText={setNewName} placeholder="Название" placeholderTextColor="#999" />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.halfInput, { color: text }]} value={newLat} onChangeText={setNewLat} placeholder="Широта" keyboardType="numeric" placeholderTextColor="#999" />
            <TextInput style={[styles.input, styles.halfInput, { color: text }]} value={newLng} onChangeText={setNewLng} placeholder="Долгота" keyboardType="numeric" placeholderTextColor="#999" />
          </View>
          <View style={styles.row}>
            <Pressable style={[styles.typeChip, newType === 'city' && styles.typeChipActive]} onPress={() => setNewType('city')}>
              <Text style={[styles.typeText, newType === 'city' && styles.typeTextActive]}>Город</Text>
            </Pressable>
            <Pressable style={[styles.typeChip, newType === 'port' && styles.typeChipActive]} onPress={() => setNewType('port')}>
              <Text style={[styles.typeText, newType === 'port' && styles.typeTextActive]}>Порт</Text>
            </Pressable>
          </View>
          <TextInput style={[styles.input, { color: text }]} value={newCountry} onChangeText={setNewCountry} placeholder="Страна" placeholderTextColor="#999" />
          <Pressable style={styles.addButton} onPress={addLocation}>
            <Text style={styles.addButtonText}>Добавить</Text>
          </Pressable>

          <Text style={[styles.sectionTitle, { color: text }]}>Существующие точки</Text>
          {locations.map(loc => (
            <View key={loc.id} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: text }]}>{loc.name}</Text>
                <Text style={styles.itemSub}>{loc.point_type === 'city' ? 'Город' : 'Порт'} | {loc.country} | {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}</Text>
              </View>
              <Pressable onPress={() => deleteLocation(loc.id)}>
                <Text style={styles.deleteText}>Удалить</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {tab === 'routes' && (
        <>
          {routes.map(route => (
            <View key={route.id} style={styles.routeCard}>
              <Text style={[styles.routeTitle, { color: text }]}>{route.name}</Text>
              {route.legs.map(leg => (
                <View key={leg.id}>
                  <Pressable
                    style={styles.legItem}
                    onPress={() => {
                      if (editingLeg?.legId === leg.id) {
                        setEditingLeg(null);
                      } else {
                        setEditingLeg({ routeId: route.id, legId: leg.id });
                        setLegCost(String(leg.cost_per_ton));
                        setLegCostMin(String(leg.cost_min));
                        setLegCostMax(String(leg.cost_max));
                        setLegDuration(String(leg.duration_days));
                      }
                    }}
                  >
                    <Text style={[styles.legLabel, { color: text }]}>{leg.label}</Text>
                    <Text style={styles.legDetails}>
                      {leg.cost_per_ton} {leg.currency} | {leg.duration_days} дн.
                    </Text>
                  </Pressable>

                  {editingLeg?.legId === leg.id && (
                    <View style={styles.editForm}>
                      <Text style={[styles.editLabel, { color: text }]}>Ставка ({leg.currency}/т)</Text>
                      <TextInput style={[styles.input, { color: text }]} value={legCost} onChangeText={setLegCost} keyboardType="numeric" placeholderTextColor="#999" />
                      <View style={styles.row}>
                        <TextInput style={[styles.input, styles.halfInput, { color: text }]} value={legCostMin} onChangeText={setLegCostMin} placeholder="Мин." keyboardType="numeric" placeholderTextColor="#999" />
                        <TextInput style={[styles.input, styles.halfInput, { color: text }]} value={legCostMax} onChangeText={setLegCostMax} placeholder="Макс." keyboardType="numeric" placeholderTextColor="#999" />
                      </View>
                      <Text style={[styles.editLabel, { color: text }]}>Срок (дней)</Text>
                      <TextInput style={[styles.input, { color: text }]} value={legDuration} onChangeText={setLegDuration} keyboardType="numeric" placeholderTextColor="#999" />
                      <Pressable style={styles.saveButton} onPress={saveLeg}>
                        <Text style={styles.saveButtonText}>Сохранить</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  tabRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#e8e8e8' },
  tabActive: { backgroundColor: '#0a7ea4' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#333' },
  tabTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8 },
  halfInput: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#e8e8e8', marginBottom: 8 },
  typeChipActive: { backgroundColor: '#0a7ea4' },
  typeText: { color: '#333', fontSize: 14 },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  addButton: { backgroundColor: '#0a7ea4', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  itemName: { fontSize: 15, fontWeight: '500' },
  itemSub: { fontSize: 12, color: '#888', marginTop: 2 },
  deleteText: { color: '#e74c3c', fontSize: 14, fontWeight: '500' },
  routeCard: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 12 },
  routeTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  legItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  legLabel: { fontSize: 14 },
  legDetails: { fontSize: 13, color: '#666' },
  editForm: { backgroundColor: '#e8f4f8', borderRadius: 8, padding: 10, marginVertical: 6 },
  editLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  saveButton: { backgroundColor: '#27ae60', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
