import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { T } from '../../src/lib/theme';
import { api, Cliente } from '../../src/lib/api';
import { todayISO } from '../../src/lib/locality';

const HORAS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00',
];

export default function NovaVisita() {
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string; cliente_id?: string }>();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState('');
  const [clienteId, setClienteId] = useState<string>(params.cliente_id || '');
  const [data, setData] = useState<string>(params.data || todayISO());
  const [hora, setHora] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [a, setA] = useState(false);

  useEffect(() => { (async () => setClientes(await api.listClientes()))(); }, []);

  const cliente = clientes.find((c) => c.id === clienteId);

  const dias = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });

  const guardar = async () => {
    if (!clienteId) { Alert.alert('Cliente em falta', 'Escolhe um cliente.'); return; }
    if (!data) { Alert.alert('Data em falta', 'Escolhe uma data.'); return; }
    if (!hora) { Alert.alert('Hora em falta', 'Escolhe uma hora.'); return; }
    setA(true);
    try {
      await api.createVisita({ cliente_id: clienteId, data, hora, notas });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha a criar visita');
    } finally {
      setA(false);
    }
  };

  const filtrados = clientes.filter((c) =>
    !filtro.trim() || c.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: T.s4, paddingBottom: 120 }}>
        <Text style={styles.label}>CLIENTE *</Text>
        {cliente ? (
          <TouchableOpacity style={styles.selectedCard} onPress={() => setClienteId('')} testID="visita-cliente-clear">
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedNome}>{cliente.nome}</Text>
              {!!cliente.morada && <Text style={styles.selectedMorada}>{cliente.morada}</Text>}
            </View>
            <Ionicons name="close" size={18} color={T.textMute} />
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              value={filtro}
              onChangeText={setFiltro}
              placeholder="Procurar cliente..."
              placeholderTextColor={T.textMute}
              style={styles.input}
              testID="visita-cliente-search"
            />
            <View style={{ maxHeight: 220, marginTop: T.s2 }}>
              {filtrados.slice(0, 10).map((c) => (
                <TouchableOpacity key={c.id} style={styles.clienteOpt} onPress={() => setClienteId(c.id)} testID={`visita-pick-${c.id}`}>
                  <Text style={styles.clienteOptNome}>{c.nome}</Text>
                  {!!c.morada && <Text style={styles.clienteOptMorada}>{c.morada}</Text>}
                </TouchableOpacity>
              ))}
              {clientes.length === 0 && (
                <TouchableOpacity onPress={() => router.push('/cliente/new')} style={styles.clienteOpt}>
                  <Text style={{ color: T.accent, fontWeight: '700' }}>+ Criar primeiro cliente</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <Text style={[styles.label, { marginTop: T.s4 }]}>DATA</Text>
        <FlatList
          horizontal
          data={dias}
          keyExtractor={(d) => d}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          renderItem={({ item }) => {
            const sel = item === data;
            const d = new Date(item + 'T00:00:00');
            return (
              <TouchableOpacity style={[styles.diaPick, sel && styles.diaPickSel]} onPress={() => setData(item)} testID={`visita-dia-${item}`}>
                <Text style={[styles.diaPickWd, sel && { color: T.bg }]}>{format(d, 'EEE')}</Text>
                <Text style={[styles.diaPickD, sel && { color: T.bg }]}>{format(d, 'd MMM')}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <Text style={[styles.label, { marginTop: T.s4 }]}>HORA</Text>
        <View style={styles.horasGrid}>
          {HORAS.map((h) => {
            const sel = hora === h;
            return (
              <TouchableOpacity
                key={h}
                style={[styles.horaPick, sel && styles.horaPickSel]}
                onPress={() => setHora(h)}
                testID={`visita-hora-${h}`}
              >
                <Text style={[styles.horaText, sel && { color: T.bg }]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: T.s4 }]}>NOTAS</Text>
        <TextInput
          value={notas}
          onChangeText={setNotas}
          multiline
          placeholder="Detalhes da visita..."
          placeholderTextColor={T.textMute}
          style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
          testID="visita-notas"
        />

        <TouchableOpacity style={[styles.btn, a && { opacity: 0.6 }]} onPress={guardar} disabled={a} testID="visita-save">
          <Text style={styles.btnText}>{a ? 'A guardar...' : 'Agendar Visita'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  label: { color: T.textMute, fontSize: 11, letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, paddingHorizontal: T.s3, paddingVertical: 12,
    color: T.text, fontSize: 15,
  },
  selectedCard: {
    backgroundColor: T.bgCard, borderColor: T.accent, borderWidth: 1,
    borderRadius: T.r2, padding: T.s3, flexDirection: 'row', alignItems: 'center', gap: T.s3,
  },
  selectedNome: { color: T.text, fontWeight: '700', fontSize: 15 },
  selectedMorada: { color: T.textDim, fontSize: 12, marginTop: 2 },
  clienteOpt: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r1, padding: T.s3, marginBottom: 4,
  },
  clienteOptNome: { color: T.text, fontWeight: '600' },
  clienteOptMorada: { color: T.textDim, fontSize: 12, marginTop: 2 },
  diaPick: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1, borderRadius: T.r2,
    paddingHorizontal: T.s3, paddingVertical: T.s2, alignItems: 'center', minWidth: 64,
  },
  diaPickSel: { backgroundColor: T.accent, borderColor: T.accent },
  diaPickWd: { color: T.textMute, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  diaPickD: { color: T.text, fontWeight: '600', fontSize: 13, marginTop: 2 },
  horasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  horaPick: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1, borderRadius: T.r1,
    paddingHorizontal: 10, paddingVertical: 8, minWidth: 60, alignItems: 'center',
  },
  horaPickSel: { backgroundColor: T.accent, borderColor: T.accent },
  horaText: { color: T.text, fontWeight: '600', fontSize: 12 },
  btn: { backgroundColor: T.accent, paddingVertical: 14, borderRadius: T.r2, alignItems: 'center', marginTop: T.s4 },
  btnText: { color: T.bg, fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});
