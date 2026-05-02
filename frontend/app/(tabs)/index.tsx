import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
  Modal, Linking, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { T } from '../../src/lib/theme';
import { api, Cliente, Visita } from '../../src/lib/api';
import { todayISO, tomorrowISO, clienteLocalidade } from '../../src/lib/locality';

const POPUP_KEY = 'lustro:popup_shown_v1';

export default function HojeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [hoje, setHoje] = useState<Visita[]>([]);
  const [amanha, setAmanha] = useState<Visita[]>([]);
  const [contratos, setContratos] = useState<number>(0);
  const [popupShown, setPopupShown] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [cs, vh, va, ct] = await Promise.all([
        api.listClientes(),
        api.listVisitas({ data: todayISO() }),
        api.listVisitas({ data: tomorrowISO() }),
        api.listContratos(),
      ]);
      setClientes(cs);
      setHoje(vh);
      setAmanha(va);
      setContratos(ct.length);
    } catch (e: any) {
      console.warn('Dashboard load error:', e?.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  // Popup 1x por sessão
  useEffect(() => {
    (async () => {
      if (popupShown) return;
      if (amanha.length === 0) return;
      try {
        const seen = await AsyncStorage.getItem(POPUP_KEY);
        // O popup deve aparecer 1x por sessão. Limpamos quando a app reabre.
        // Como não há lifecycle session-aware aqui, usamos uma key da data corrente.
        const today = todayISO();
        if (seen === today) return;
        setPopupShown(true);
        await AsyncStorage.setItem(POPUP_KEY, today);
      } catch {}
    })();
  }, [amanha, popupShown]);

  const onRefresh = async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  };

  const clienteNome = (id: string) => clientes.find((c) => c.id === id)?.nome || 'Cliente';
  const clienteRef = (id: string) => clientes.find((c) => c.id === id);

  const linhaVisita = (v: Visita) => {
    const c = clienteRef(v.cliente_id);
    const loc = c ? clienteLocalidade(c) : '';
    const nome = c?.nome || 'Cliente';
    return loc ? `${v.hora} — ${nome} (${loc})` : `${v.hora} — ${nome}`;
  };

  const abrirWaze = (v: Visita) => {
    const c = clienteRef(v.cliente_id);
    if (!c?.morada) {
      Alert.alert('Morada em falta', 'Este cliente não tem morada registada.');
      return;
    }
    const url = `https://waze.com/ul?q=${encodeURIComponent(c.morada)}&navigate=yes`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o Waze.'));
  };

  const temAlerta = amanha.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: T.s4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.text} />}
      >
        {/* ALERTA AMANHÃ */}
        {temAlerta && (
          <View style={styles.alertBox} testID="alert-amanha">
            <View style={styles.alertHead}>
              <Ionicons name="warning-outline" size={20} color="#1f1607" />
              <Text style={styles.alertTitle}>
                Amanhã tens {amanha.length} {amanha.length === 1 ? 'serviço agendado' : 'serviços agendados'}
              </Text>
            </View>
            {amanha.slice(0, 4).map((v) => (
              <Text key={v.id} style={styles.alertItem}>{linhaVisita(v)}</Text>
            ))}
          </View>
        )}

        {/* DATA STATS */}
        <View style={styles.statsRow}>
          <Stat label="HOJE" value={String(hoje.length)} />
          <Stat label="AMANHÃ" value={String(amanha.length)} />
          <Stat label="CLIENTES" value={String(clientes.length)} />
        </View>

        {/* HOJE */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>HOJE</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/agenda')} testID="open-agenda">
              <Text style={styles.linkSm}>Ver agenda →</Text>
            </TouchableOpacity>
          </View>
          {hoje.length === 0 ? (
            <Text style={styles.emptyText}>Sem visitas agendadas para hoje</Text>
          ) : (
            hoje.map((v) => (
              <VisitaRow key={v.id} v={v} clienteNome={clienteNome(v.cliente_id)}
                localidade={clienteLocalidade(clienteRef(v.cliente_id) || {})}
                onWaze={() => abrirWaze(v)}
                onPress={() => router.push(`/cliente/${v.cliente_id}`)}
              />
            ))
          )}
        </View>

        {/* AMANHÃ */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>AMANHÃ</Text>
          </View>
          {amanha.length === 0 ? (
            <Text style={styles.emptyText}>Sem visitas agendadas para amanhã</Text>
          ) : (
            amanha.map((v) => (
              <VisitaRow key={v.id} v={v} clienteNome={clienteNome(v.cliente_id)}
                localidade={clienteLocalidade(clienteRef(v.cliente_id) || {})}
                onWaze={() => abrirWaze(v)}
                onPress={() => router.push(`/cliente/${v.cliente_id}`)}
              />
            ))
          )}
        </View>

        {/* ATALHOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ATALHOS</Text>
          <View style={{ flexDirection: 'row', gap: T.s3, flexWrap: 'wrap', marginTop: T.s3 }}>
            <Atalho icon="calendar" label="Nova visita" onPress={() => router.push('/visita/new')} testID="atalho-visita" />
            <Atalho icon="person-add" label="Novo cliente" onPress={() => router.push('/cliente/new')} testID="atalho-cliente" />
            <Atalho icon="document-text" label="Documentos" onPress={() => router.push('/(tabs)/documentos')} testID="atalho-docs" />
            <Atalho icon="time" label={`Contratos (${contratos})`} onPress={() => router.push('/contratos/historico')} testID="atalho-contratos" />
          </View>
        </View>
      </ScrollView>

      {/* POPUP LEVE */}
      <Modal transparent visible={popupShown && temAlerta} animationType="fade" onRequestClose={() => setPopupShown(false)}>
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard} testID="popup-amanha">
            <Ionicons name="alarm-outline" size={28} color={T.warning} />
            <Text style={styles.popupTitle}>
              Amanhã tens {amanha.length} {amanha.length === 1 ? 'serviço agendado' : 'serviços agendados'}
            </Text>
            <Text style={styles.popupSub}>
              {amanha.slice(0, 3).map((v) => linhaVisita(v)).join('\n')}
            </Text>
            <View style={styles.popupActions}>
              <TouchableOpacity onPress={() => setPopupShown(false)} style={[styles.popupBtn, styles.popupBtnGhost]} testID="popup-fechar">
                <Text style={styles.popupBtnGhostText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setPopupShown(false); router.push('/(tabs)/agenda'); }}
                style={[styles.popupBtn, styles.popupBtnPrimary]}
                testID="popup-ver-agenda"
              >
                <Text style={styles.popupBtnPrimaryText}>Ver agenda</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Atalho({ icon, label, onPress, testID }: { icon: any; label: string; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity style={styles.atalho} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={20} color={T.accent} />
      <Text style={styles.atalhoText}>{label}</Text>
    </TouchableOpacity>
  );
}

function VisitaRow({
  v, clienteNome, localidade, onWaze, onPress,
}: { v: Visita; clienteNome: string; localidade: string; onWaze: () => void; onPress: () => void }) {
  const linha = localidade ? `${v.hora} — ${clienteNome} (${localidade})` : `${v.hora} — ${clienteNome}`;
  return (
    <View style={styles.visitaRow}>
      <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
        <Text style={styles.linhaVisita} numberOfLines={1}>{linha}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onWaze} style={styles.wazeBtn} testID={`waze-${v.id}`}>
        <Ionicons name="navigate" size={16} color={T.bg} />
        <Text style={styles.wazeBtnText}>Waze</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, paddingHorizontal: T.s4 },
  alertBox: {
    backgroundColor: '#fbe28a',
    borderColor: T.warningBorder,
    borderWidth: 1,
    borderRadius: T.r2,
    paddingVertical: T.s3,
    paddingHorizontal: T.s4,
    marginBottom: T.s4,
  },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: T.s2, marginBottom: T.s2 },
  alertTitle: { color: '#1f1607', fontWeight: '700', fontSize: 14 },
  alertItem: { color: '#2a1d05', fontSize: 13, lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: T.s3, marginBottom: T.s5 },
  statCard: {
    flex: 1, backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, paddingVertical: T.s3, paddingHorizontal: T.s3,
  },
  statValue: { color: T.text, fontSize: 22, fontWeight: '600' },
  statLabel: { color: T.textMute, fontSize: 10, letterSpacing: 1.5, marginTop: 2 },

  section: { marginBottom: T.s5 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.s3 },
  sectionTitle: { color: T.text, letterSpacing: 2, fontSize: 12, fontWeight: '700' },
  linkSm: { color: T.accent, fontSize: 12, fontWeight: '600' },
  emptyText: { color: T.textMute, fontSize: 13, paddingVertical: T.s3 },

  visitaRow: {
    flexDirection: 'row', alignItems: 'center', gap: T.s3,
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, paddingHorizontal: T.s3, paddingVertical: T.s3, marginBottom: T.s2,
  },
  hora: { color: T.accent, fontSize: 16, fontWeight: '700', minWidth: 50 },
  clienteNome: { color: T.text, fontSize: 14, fontWeight: '600' },
  localidade: { color: T.textDim, fontSize: 12, marginTop: 1 },
  linhaVisita: { color: T.text, fontSize: 14, fontWeight: '500' },

  wazeBtn: {
    backgroundColor: T.accent, paddingHorizontal: T.s3, paddingVertical: 8, borderRadius: T.r1,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  wazeBtnText: { color: T.bg, fontWeight: '700', fontSize: 12 },

  atalho: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    paddingHorizontal: T.s3, paddingVertical: T.s3, borderRadius: T.r2,
    flexDirection: 'row', alignItems: 'center', gap: T.s2,
    minWidth: 150, flexGrow: 1,
  },
  atalhoText: { color: T.text, fontSize: 13, fontWeight: '600' },

  popupOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: T.s5,
  },
  popupCard: {
    width: '100%', maxWidth: 360, backgroundColor: T.bgCard,
    borderColor: T.warningBorder, borderWidth: 1, borderRadius: T.r3,
    padding: T.s5, gap: T.s2,
  },
  popupTitle: { color: T.text, fontSize: 16, fontWeight: '700', marginTop: T.s2 },
  popupSub: { color: T.textDim, fontSize: 13, lineHeight: 19 },
  popupActions: { flexDirection: 'row', gap: T.s3, marginTop: T.s3 },
  popupBtn: { flex: 1, paddingVertical: T.s3, borderRadius: T.r1, alignItems: 'center' },
  popupBtnGhost: { borderWidth: 1, borderColor: T.border, backgroundColor: T.bgElev },
  popupBtnGhostText: { color: T.text, fontWeight: '600' },
  popupBtnPrimary: { backgroundColor: T.accent },
  popupBtnPrimaryText: { color: T.bg, fontWeight: '700' },
});
