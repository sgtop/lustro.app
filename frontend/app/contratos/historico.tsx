import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../src/lib/theme';
import { api, Contrato } from '../../src/lib/api';

export default function HistoricoContratos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [proxima, setProxima] = useState<string>('');

  const carregar = useCallback(async () => {
    try {
      const [list, prox] = await Promise.all([api.listContratos(), api.proximoNumero()]);
      setContratos(list);
      setProxima(prox.ref);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const marcarAssinado = (c: Contrato) => {
    Alert.alert('Marcar como assinado', `${c.ref}\nIsto irá avançar a numeração se ainda não for final.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        try {
          await api.updateContrato(c.id, { estado: 'assinado', confirmar_final: true });
          await carregar();
        } catch (e: any) { Alert.alert('Erro', e?.message || String(e)); }
      } },
    ]);
  };

  const eliminar = (c: Contrato) => {
    Alert.alert('Eliminar contrato', `${c.ref} será removido do histórico.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await api.deleteContrato(c.id);
        carregar();
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.proximaCard}>
        <Text style={styles.proximaLabel}>PRÓXIMA REFERÊNCIA</Text>
        <Text style={styles.proximaRef}>{proxima || '...'}</Text>
        <Text style={styles.proximaSub}>Avança automaticamente quando confirmar como final ou marcar contrato como assinado.</Text>
      </View>

      <FlatList
        data={contratos}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: insets.bottom + 80, paddingTop: T.s2 }}
        ItemSeparatorComponent={() => <View style={{ height: T.s2 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await carregar(); setRefreshing(false); }} tintColor={T.text} />}
        ListEmptyComponent={
          <View style={{ paddingVertical: T.s7, alignItems: 'center' }}>
            <Ionicons name="time-outline" size={36} color={T.textMute} />
            <Text style={{ color: T.textMute, marginTop: T.s3 }}>Sem contratos registados</Text>
            <TouchableOpacity onPress={() => router.push('/documento/contrato')} style={{ marginTop: T.s3 }}>
              <Text style={{ color: T.accent, fontWeight: '700' }}>+ Gerar contrato</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card} testID={`contrato-${item.id}`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ref}>{item.ref}</Text>
              <Text style={styles.cliente}>{item.cliente_nome || 'Sem cliente'} · {item.data || '—'}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <View style={[styles.pill, item.estado === 'assinado' ? styles.pillSuccess : styles.pillWarn]}>
                  <Text style={styles.pillText}>{item.estado}</Text>
                </View>
                {item.final && (
                  <View style={[styles.pill, styles.pillAccent]}>
                    <Text style={styles.pillText}>final</Text>
                  </View>
                )}
                {item.valor ? (
                  <View style={[styles.pill, styles.pillNeutral]}>
                    <Text style={styles.pillText}>{Number(item.valor).toFixed(2).replace('.', ',')} €</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={{ gap: 6 }}>
              {item.estado !== 'assinado' && (
                <TouchableOpacity onPress={() => marcarAssinado(item)} style={styles.actionMini} testID={`contrato-assinar-${item.id}`}>
                  <Ionicons name="checkmark" size={14} color={T.bg} />
                  <Text style={styles.actionMiniText}>Assinado</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => eliminar(item)} style={styles.delMini} testID={`contrato-del-${item.id}`}>
                <Ionicons name="trash-outline" size={14} color={T.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  proximaCard: {
    margin: T.s4, padding: T.s4, borderRadius: T.r3,
    backgroundColor: T.bgCard, borderColor: T.accent, borderWidth: 1,
  },
  proximaLabel: { color: T.textMute, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  proximaRef: { color: T.accent, fontSize: 28, fontWeight: '700', letterSpacing: 1, marginTop: 6 },
  proximaSub: { color: T.textDim, fontSize: 12, marginTop: 4, lineHeight: 18 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: T.s3,
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, padding: T.s3,
  },
  ref: { color: T.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.6 },
  cliente: { color: T.textDim, fontSize: 12, marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 30, borderWidth: 0.6 },
  pillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: T.text },
  pillSuccess: { backgroundColor: '#0e3322', borderColor: '#1a5e3f' },
  pillWarn: { backgroundColor: '#332910', borderColor: '#5e4a1a' },
  pillAccent: { backgroundColor: T.accent, borderColor: T.accent },
  pillNeutral: { backgroundColor: T.bgElev, borderColor: T.borderStrong },
  actionMini: {
    backgroundColor: T.success, paddingHorizontal: 10, paddingVertical: 6, borderRadius: T.r1,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  actionMiniText: { color: T.bg, fontWeight: '700', fontSize: 11 },
  delMini: {
    width: 28, height: 28, borderRadius: T.r1, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: T.bgElev,
  },
});
