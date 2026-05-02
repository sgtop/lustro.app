import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Linking,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../src/lib/theme';
import { api, Cliente, Visita } from '../../src/lib/api';
import { extractLocalidade, clienteLocalidade } from '../../src/lib/locality';

export default function ClienteDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Cliente | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Cliente>>({});
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [a, setA] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    try {
      const cli = await api.getCliente(id);
      setC(cli);
      setForm(cli);
      const vs = await api.listVisitas({ cliente_id: id });
      setVisitas(vs);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível carregar');
    }
  }, [id]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const guardar = async () => {
    if (!id) return;
    setA(true);
    try {
      const updated = await api.updateCliente(id, form);
      setC(updated);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha a guardar');
    } finally {
      setA(false);
    }
  };

  const eliminar = () => {
    Alert.alert('Eliminar cliente', 'Esta acção elimina também as visitas associadas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        if (!id) return;
        await api.deleteCliente(id);
        router.back();
      } },
    ]);
  };

  const abrirWaze = () => {
    if (!c?.morada) { Alert.alert('Morada em falta', 'Sem morada registada.'); return; }
    Linking.openURL(`https://waze.com/ul?q=${encodeURIComponent(c.morada)}&navigate=yes`);
  };

  if (!c) return <View style={{ flex: 1, backgroundColor: T.bg }} />;

  const localidadeAuto = extractLocalidade(form.morada);
  const loc = clienteLocalidade(c);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: T.s4, paddingBottom: 120 }}>
        {!editing ? (
          <>
            <Text style={styles.nome}>{c.nome}</Text>
            {!!loc && <Text style={styles.loc}>{loc}</Text>}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.action} onPress={abrirWaze} testID="cli-waze">
                <Ionicons name="navigate" size={16} color={T.bg} />
                <Text style={styles.actionText}>Abrir no Waze</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionDark} onPress={() => router.push(`/visita/new?cliente_id=${c.id}`)} testID="cli-add-visita">
                <Ionicons name="calendar" size={16} color={T.text} />
                <Text style={styles.actionDarkText}>Nova visita</Text>
              </TouchableOpacity>
            </View>

            <Info label="Morada" value={c.morada} />
            <Info label="Localidade" value={c.localidade} />
            <Info label="Contacto" value={c.contacto} />
            <Info label="Email" value={c.email} />
            <Info label="NIF" value={c.nif} />
            <Info label="Notas" value={c.notas} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>VISITAS · {visitas.length}</Text>
              {visitas.length === 0 ? (
                <Text style={styles.empty}>Sem visitas registadas</Text>
              ) : (
                visitas.map((v) => (
                  <View key={v.id} style={styles.visitaRow}>
                    <Text style={styles.visitaData}>{v.data}</Text>
                    <Text style={styles.visitaHora}>{v.hora}</Text>
                    <Text style={[styles.visitaEstado, v.estado === 'concluida' && { color: T.success }, v.estado === 'cancelada' && { color: T.danger }]}>{v.estado}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: T.s2, marginTop: T.s4 }}>
              <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => setEditing(true)} testID="cli-edit">
                <Text style={styles.btnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnGhost]} onPress={eliminar} testID="cli-delete">
                <Ionicons name="trash-outline" size={18} color={T.danger} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <FieldEdit label="Nome / Empresa" value={form.nome || ''} onChangeText={(t) => setForm({ ...form, nome: t })} />
            <FieldEdit label="Morada" value={form.morada || ''} onChangeText={(t) => setForm({ ...form, morada: t })} multiline />
            <FieldEdit
              label="Localidade"
              value={form.localidade || ''}
              onChangeText={(t) => setForm({ ...form, localidade: t })}
              placeholder={localidadeAuto ? `(auto: ${localidadeAuto})` : 'Ex: Oeiras'}
            />
            <FieldEdit label="Contacto" value={form.contacto || ''} onChangeText={(t) => setForm({ ...form, contacto: t })} keyboardType="phone-pad" />
            <FieldEdit label="Email" value={form.email || ''} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" autoCapitalize="none" />
            <FieldEdit label="NIF" value={form.nif || ''} onChangeText={(t) => setForm({ ...form, nif: t })} keyboardType="numeric" />
            <FieldEdit label="Notas" value={form.notas || ''} onChangeText={(t) => setForm({ ...form, notas: t })} multiline />

            <View style={{ flexDirection: 'row', gap: T.s2 }}>
              <TouchableOpacity style={[styles.btn, { flex: 1, opacity: a ? 0.6 : 1 }]} onPress={guardar} disabled={a} testID="cli-save-edit">
                <Text style={styles.btnText}>{a ? 'A guardar...' : 'Guardar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnGhost]} onPress={() => { setForm(c); setEditing(false); }}>
                <Text style={{ color: T.text, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ marginBottom: T.s3 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function FieldEdit(props: any) {
  return (
    <View style={{ marginBottom: T.s3 }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        {...props}
        style={[styles.input, props.multiline && { minHeight: 70, textAlignVertical: 'top' }]}
        placeholderTextColor={T.textMute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  nome: { color: T.text, fontSize: 24, fontWeight: '700', letterSpacing: 0.5 },
  loc: { color: T.accent, fontSize: 14, marginTop: 2, marginBottom: T.s4 },
  actionsRow: { flexDirection: 'row', gap: T.s2, marginBottom: T.s5 },
  action: { backgroundColor: T.accent, paddingHorizontal: T.s3, paddingVertical: 10, borderRadius: T.r1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: T.bg, fontWeight: '700', fontSize: 13 },
  actionDark: { backgroundColor: T.bgCard, borderColor: T.borderStrong, borderWidth: 1, paddingHorizontal: T.s3, paddingVertical: 10, borderRadius: T.r1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionDarkText: { color: T.text, fontWeight: '600', fontSize: 13 },
  label: { color: T.textMute, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  value: { color: T.text, fontSize: 14, lineHeight: 20 },
  input: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, paddingHorizontal: T.s3, paddingVertical: 12,
    color: T.text, fontSize: 15,
  },
  section: { marginTop: T.s5 },
  sectionTitle: { color: T.text, letterSpacing: 1.5, fontSize: 11, fontWeight: '700', marginBottom: T.s3 },
  empty: { color: T.textMute, fontSize: 13 },
  visitaRow: { flexDirection: 'row', backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1, borderRadius: T.r1, paddingHorizontal: T.s3, paddingVertical: T.s3, marginBottom: 6, gap: T.s3 },
  visitaData: { color: T.text, fontWeight: '600' },
  visitaHora: { color: T.accent, fontWeight: '700', flex: 1 },
  visitaEstado: { color: T.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  btn: { backgroundColor: T.accent, paddingVertical: 14, borderRadius: T.r2, alignItems: 'center' },
  btnText: { color: T.bg, fontWeight: '700', fontSize: 15 },
  btnGhost: { paddingVertical: 14, paddingHorizontal: T.s4, borderRadius: T.r2, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bgElev },
});
