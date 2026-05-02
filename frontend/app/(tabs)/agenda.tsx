import { useCallback, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Linking, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { T } from '../../src/lib/theme';
import { api, Cliente, Visita } from '../../src/lib/api';
import { clienteLocalidade, todayISO } from '../../src/lib/locality';

export default function AgendaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [diaSel, setDiaSel] = useState<string>(todayISO());
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const carregar = useCallback(async () => {
    try {
      const [v, c] = await Promise.all([
        api.listVisitas({ data: diaSel }),
        api.listClientes(),
      ]);
      setVisitas(v);
      setClientes(c);
    } catch {}
  }, [diaSel]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const dias = useMemo(() => {
    const arr: { iso: string; label: string; weekday: string }[] = [];
    for (let i = -1; i <= 13; i++) {
      const d = addDays(new Date(), i);
      arr.push({
        iso: format(d, 'yyyy-MM-dd'),
        label: format(d, 'd MMM', { locale: ptBR }),
        weekday: format(d, 'EEE', { locale: ptBR }),
      });
    }
    return arr;
  }, []);

  const clienteRef = (id: string) => clientes.find((c) => c.id === id);

  const abrirWaze = (v: Visita) => {
    const c = clienteRef(v.cliente_id);
    if (!c?.morada) {
      Alert.alert('Morada em falta', 'Este cliente não tem morada registada.');
      return;
    }
    const url = `https://waze.com/ul?q=${encodeURIComponent(c.morada)}&navigate=yes`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o Waze.'));
  };

  const eliminarVisita = (v: Visita) => {
    Alert.alert('Eliminar visita', 'Confirma a eliminação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await api.deleteVisita(v.id);
        carregar();
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>{format(new Date(diaSel + 'T00:00:00'), "EEEE',' d 'de' MMMM", { locale: ptBR })}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push(`/visita/new?data=${diaSel}`)} testID="visita-add">
          <Ionicons name="add" size={22} color={T.bg} />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={dias}
        keyExtractor={(d) => d.iso}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: T.s2, paddingVertical: T.s3 }}
        renderItem={({ item }) => {
          const sel = item.iso === diaSel;
          return (
            <TouchableOpacity
              style={[styles.dia, sel && styles.diaSel]}
              onPress={() => setDiaSel(item.iso)}
              testID={`dia-${item.iso}`}
            >
              <Text style={[styles.diaWeekday, sel && styles.diaSelText]}>{item.weekday}</Text>
              <Text style={[styles.diaLabel, sel && styles.diaSelText]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={visitas}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ paddingTop: T.s3, paddingBottom: insets.bottom + 80 }}
        ItemSeparatorComponent={() => <View style={{ height: T.s2 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await carregar(); setRefreshing(false); }} tintColor={T.text} />}
        ListEmptyComponent={
          <View style={{ paddingVertical: T.s7, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={36} color={T.textMute} />
            <Text style={{ color: T.textMute, marginTop: T.s3 }}>Sem visitas para este dia</Text>
            <TouchableOpacity onPress={() => router.push(`/visita/new?data=${diaSel}`)} style={{ marginTop: T.s3 }}>
              <Text style={{ color: T.accent, fontWeight: '700' }}>+ Agendar visita</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const c = clienteRef(item.cliente_id);
          const loc = c ? clienteLocalidade(c) : '';
          return (
            <View style={styles.card} testID={`visita-row-${item.id}`}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{item.hora}</Text>
              </View>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => c && router.push(`/cliente/${c.id}`)}>
                <Text style={styles.linha}>
                  {item.hora} — {c?.nome || 'Cliente'}{loc ? ` (${loc})` : ''}
                </Text>
                {!!item.notas && <Text style={styles.notas} numberOfLines={1}>{item.notas}</Text>}
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => abrirWaze(item)} style={styles.actionBtn} testID={`visita-waze-${item.id}`}>
                  <Ionicons name="navigate" size={14} color={T.bg} />
                  <Text style={styles.actionText}>Waze</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => eliminarVisita(item)} style={styles.delBtn} testID={`visita-del-${item.id}`}>
                  <Ionicons name="trash-outline" size={14} color={T.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, paddingHorizontal: T.s4, paddingTop: T.s2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: T.s2 },
  headerLabel: { color: T.text, fontWeight: '600', fontSize: 14, textTransform: 'capitalize' },
  addBtn: {
    backgroundColor: T.accent, width: 36, height: 36, borderRadius: T.r2,
    alignItems: 'center', justifyContent: 'center',
  },
  dia: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    paddingHorizontal: T.s3, paddingVertical: T.s2, borderRadius: T.r2,
    minWidth: 64, alignItems: 'center',
  },
  diaSel: { backgroundColor: T.accent, borderColor: T.accent },
  diaSelText: { color: T.bg },
  diaWeekday: { color: T.textMute, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  diaLabel: { color: T.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: T.s3,
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, paddingHorizontal: T.s3, paddingVertical: T.s3,
  },
  timeBox: {
    backgroundColor: T.bgElev, borderColor: T.borderStrong, borderWidth: 1,
    borderRadius: T.r1, paddingHorizontal: 10, paddingVertical: 6,
  },
  timeText: { color: T.accent, fontSize: 14, fontWeight: '700' },
  linha: { color: T.text, fontSize: 14, fontWeight: '500' },
  notas: { color: T.textDim, fontSize: 12, marginTop: 2 },
  actionBtn: {
    backgroundColor: T.accent, paddingHorizontal: 10, paddingVertical: 6, borderRadius: T.r1,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  actionText: { color: T.bg, fontWeight: '700', fontSize: 11 },
  delBtn: {
    width: 30, height: 30, borderRadius: T.r1, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: T.bgElev,
  },
});
