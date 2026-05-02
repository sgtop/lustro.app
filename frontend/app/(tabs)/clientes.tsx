import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../src/lib/theme';
import { api, Cliente } from '../../src/lib/api';
import { clienteLocalidade } from '../../src/lib/locality';

export default function ClientesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    try {
      const cs = await api.listClientes();
      setClientes(cs);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const filtrados = clientes.filter((c) => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nome?.toLowerCase().includes(q) ||
      c.morada?.toLowerCase().includes(q) ||
      c.localidade?.toLowerCase().includes(q) ||
      c.contacto?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.headerRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={T.textMute} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Procurar cliente..."
            placeholderTextColor={T.textMute}
            style={styles.search}
            testID="clientes-search"
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/cliente/new')}
          testID="cliente-add"
        >
          <Ionicons name="add" size={22} color={T.bg} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await carregar(); setRefreshing(false); }} tintColor={T.text} />}
        ItemSeparatorComponent={() => <View style={{ height: T.s2 }} />}
        ListEmptyComponent={
          <View style={{ paddingVertical: T.s7, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={36} color={T.textMute} />
            <Text style={{ color: T.textMute, marginTop: T.s3 }}>Sem clientes registados</Text>
          </View>
        }
        renderItem={({ item }) => {
          const loc = clienteLocalidade(item);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/cliente/${item.id}`)}
              testID={`cliente-row-${item.id}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.nome || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome} numberOfLines={1}>{item.nome}</Text>
                {!!loc && <Text style={styles.sub} numberOfLines={1}>{loc}</Text>}
                {!!item.morada && <Text style={styles.subDim} numberOfLines={1}>{item.morada}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={T.textMute} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, paddingHorizontal: T.s4, paddingTop: T.s3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: T.s2, marginBottom: T.s3 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: T.s2,
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, paddingHorizontal: T.s3, paddingVertical: 10,
  },
  search: { flex: 1, color: T.text, fontSize: 14, paddingVertical: 0 },
  addBtn: {
    backgroundColor: T.accent, width: 44, height: 44,
    borderRadius: T.r2, alignItems: 'center', justifyContent: 'center',
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: T.s3,
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, padding: T.s3,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.bgElev, borderWidth: 1, borderColor: T.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: T.accent, fontWeight: '700', fontSize: 16 },
  nome: { color: T.text, fontSize: 15, fontWeight: '600' },
  sub: { color: T.textDim, fontSize: 12, marginTop: 2 },
  subDim: { color: T.textMute, fontSize: 11, marginTop: 1 },
});
