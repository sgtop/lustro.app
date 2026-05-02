import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Switch, Platform,
  ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { T } from '../../src/lib/theme';
import { api, Cliente } from '../../src/lib/api';
import { getDocType, DocOpts } from '../../src/lib/templates';
import { gerarPdf, partilharPdf, imprimirHtml } from '../../src/lib/pdf';
import { todayISO } from '../../src/lib/locality';

export default function DocumentoScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const doc = getDocType(String(type));
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string>('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [data, setData] = useState<string>(todayISO());
  const [periodicidade, setPeriodicidade] = useState<'mensal' | 'quinzenal'>('mensal');
  const [valor, setValor] = useState<string>('');
  const [refContrato, setRefContrato] = useState<string>('');
  const [proximaRef, setProximaRef] = useState<string>('');
  const [contratoIdAssoc, setContratoIdAssoc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => { (async () => setClientes(await api.listClientes()))(); }, []);

  // Quando o documento é Contrato, pedir próximo número
  useEffect(() => {
    if (doc?.hasContratoRef) {
      api.proximoNumero().then((r) => {
        setProximaRef(r.ref);
        setRefContrato((curr) => curr || r.ref);
      }).catch(() => {});
    }
  }, [doc]);

  // Atualiza preview HTML
  useEffect(() => {
    if (!doc) return;
    const c = clientes.find((cl) => cl.id === clienteId);
    const opts: DocOpts = {
      ref: doc.hasContratoRef ? refContrato : undefined,
      data,
      periodicidade,
      valor: valor.replace(',', '.') ? Number(valor.replace(',', '.')) : '',
      cliente: c ? {
        nome: c.nome, morada: c.morada, nif: c.nif, email: c.email,
        contacto: c.contacto, cidade: c.localidade, cp: '',
      } : undefined,
    };
    setPreviewHtml(doc.fn(opts));
  }, [doc, clientes, clienteId, data, periodicidade, valor, refContrato]);

  if (!doc) {
    return (
      <View style={styles.container}>
        <Text style={{ color: T.text, padding: T.s4 }}>Documento desconhecido.</Text>
      </View>
    );
  }

  const cliente = clientes.find((c) => c.id === clienteId);
  const filtrados = clientes.filter((c) => !filtroCliente.trim() || c.nome.toLowerCase().includes(filtroCliente.toLowerCase())).slice(0, 6);

  const buildOpts = (): DocOpts => {
    const c = clientes.find((cl) => cl.id === clienteId);
    const v = valor.replace(',', '.');
    return {
      ref: doc.hasContratoRef ? refContrato : undefined,
      data,
      periodicidade,
      valor: v ? Number(v) : '',
      cliente: c ? { nome: c.nome, morada: c.morada, nif: c.nif, email: c.email, contacto: c.contacto, cidade: c.localidade } : undefined,
    };
  };

  const ensureContrato = async (estado: 'gerado' | 'assinado'): Promise<string | null> => {
    if (!doc.hasContratoRef) return null;
    const opts = buildOpts();
    if (contratoIdAssoc) {
      const updated = await api.updateContrato(contratoIdAssoc, {
        ref: refContrato,
        data,
        valor: typeof opts.valor === 'number' ? opts.valor : 0,
        periodicidade,
        cliente_id: clienteId || undefined,
        cliente_nome: cliente?.nome || '',
        estado,
        confirmar_final: estado === 'assinado',
      });
      return updated.id;
    }
    const created = await api.createContrato({
      ref: refContrato,
      data,
      valor: typeof opts.valor === 'number' ? opts.valor : 0,
      periodicidade,
      cliente_id: clienteId || undefined,
      cliente_nome: cliente?.nome || '',
      estado,
    });
    if (estado === 'assinado') {
      const finalCt = await api.updateContrato(created.id, { confirmar_final: true });
      setRefContrato(finalCt.ref);
      setContratoIdAssoc(finalCt.id);
      return finalCt.id;
    }
    setContratoIdAssoc(created.id);
    return created.id;
  };

  const ficheiroNome = `LUSTRO_${doc.titulo.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '')}_${refContrato || data}`;

  const onGerarPdf = async () => {
    setBusy(true);
    try {
      const html = doc.fn(buildOpts());
      if (doc.hasContratoRef) await ensureContrato('gerado').catch(() => {});
      const uri = await gerarPdf(html, ficheiroNome);
      Alert.alert('PDF gerado', 'Pretende partilhar agora?', [
        { text: 'Mais tarde' },
        { text: 'Partilhar', onPress: () => partilharPdf(uri, doc.titulo) },
      ]);
    } catch (e: any) {
      Alert.alert('Erro a gerar PDF', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const onPartilhar = async () => {
    setBusy(true);
    try {
      const html = doc.fn(buildOpts());
      if (doc.hasContratoRef) await ensureContrato('gerado').catch(() => {});
      const uri = await gerarPdf(html, ficheiroNome);
      await partilharPdf(uri, doc.titulo);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const onConfirmarFinal = async () => {
    if (!doc.hasContratoRef) return;
    Alert.alert(
      'Confirmar como final',
      `Vais consumir a numeração ${refContrato || proximaRef}. Esta acção marca o contrato como assinado e avança o contador.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: async () => {
          setBusy(true);
          try {
            await ensureContrato('assinado');
            const next = await api.proximoNumero();
            setProximaRef(next.ref);
            Alert.alert('Contrato finalizado', `Próxima referência disponível: ${next.ref}`);
          } catch (e: any) {
            Alert.alert('Erro', e?.message || String(e));
          } finally {
            setBusy(false);
          }
        } },
      ]
    );
  };

  const onPrint = async () => {
    try {
      await imprimirHtml(doc.fn(buildOpts()));
    } catch (e: any) {
      Alert.alert('Erro', e?.message || String(e));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {/* HEADER */}
        <View style={styles.head}>
          <Text style={styles.title}>{doc.titulo}</Text>
          <Text style={styles.sub}>{doc.subtitulo}</Text>
        </View>

        {/* PREVIEW */}
        <View style={styles.previewWrap}>
          {Platform.OS === 'web' ? (
            <View style={styles.previewWebFallback}>
              <Text style={styles.previewWebText}>Pré-visualização disponível em mobile.</Text>
              <TouchableOpacity onPress={onPrint} style={styles.previewWebBtn}>
                <Ionicons name="eye-outline" size={16} color={T.bg} />
                <Text style={styles.previewWebBtnText}>Abrir pré-visualização</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: previewHtml }}
              style={styles.preview}
              scalesPageToFit
              javaScriptEnabled
            />
          )}
        </View>

        {/* PARÂMETROS */}
        <View style={{ paddingHorizontal: T.s4 }}>
          {(doc.isProposta || doc.hasContratoRef) && (
            <>
              <Text style={styles.label}>CLIENTE</Text>
              {cliente ? (
                <TouchableOpacity style={styles.selectedCard} onPress={() => setClienteId('')} testID="doc-cliente-clear">
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedNome}>{cliente.nome}</Text>
                    {!!cliente.morada && <Text style={styles.selectedMorada} numberOfLines={1}>{cliente.morada}</Text>}
                  </View>
                  <Ionicons name="close" size={18} color={T.textMute} />
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput
                    value={filtroCliente}
                    onChangeText={setFiltroCliente}
                    placeholder="Procurar cliente (opcional)..."
                    placeholderTextColor={T.textMute}
                    style={styles.input}
                    testID="doc-cliente-search"
                  />
                  {filtroCliente.trim() !== '' && filtrados.map((c) => (
                    <TouchableOpacity key={c.id} style={styles.clienteOpt} onPress={() => setClienteId(c.id)} testID={`doc-pick-${c.id}`}>
                      <Text style={styles.clienteOptNome}>{c.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <Text style={[styles.label, { marginTop: T.s3 }]}>DATA</Text>
              <TextInput
                value={data}
                onChangeText={setData}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={T.textMute}
                style={styles.input}
                testID="doc-data"
              />

              <Text style={[styles.label, { marginTop: T.s3 }]}>PERIODICIDADE</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggle, periodicidade === 'mensal' && styles.toggleSel]}
                  onPress={() => setPeriodicidade('mensal')}
                  testID="doc-mensal"
                >
                  <Text style={[styles.toggleText, periodicidade === 'mensal' && { color: T.bg }]}>Mensal (1x/mês)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggle, periodicidade === 'quinzenal' && styles.toggleSel]}
                  onPress={() => setPeriodicidade('quinzenal')}
                  testID="doc-quinzenal"
                >
                  <Text style={[styles.toggleText, periodicidade === 'quinzenal' && { color: T.bg }]}>Quinzenal (2x/mês)</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: T.s3 }]}>VALOR ACORDADO (€)</Text>
              <TextInput
                value={valor}
                onChangeText={setValor}
                placeholder="ex: 150"
                placeholderTextColor={T.textMute}
                keyboardType="decimal-pad"
                style={styles.input}
                testID="doc-valor"
              />
            </>
          )}

          {doc.hasContratoRef && (
            <>
              <Text style={[styles.label, { marginTop: T.s3 }]}>REFERÊNCIA DE CONTRATO</Text>
              <TextInput
                value={refContrato}
                onChangeText={setRefContrato}
                placeholder={proximaRef}
                placeholderTextColor={T.textMute}
                style={styles.input}
                autoCapitalize="characters"
                testID="doc-ref"
              />
              <Text style={styles.helper}>Próxima disponível: {proximaRef || '...'} · podes editar manualmente</Text>
            </>
          )}
        </View>

        {/* ACÇÕES */}
        <View style={[styles.actions, { marginTop: T.s4 }]}>
          <TouchableOpacity style={styles.actionPrimary} onPress={onGerarPdf} disabled={busy} testID="doc-gerar-pdf">
            {busy ? <ActivityIndicator color={T.bg} /> : (
              <><Ionicons name="document-outline" size={18} color={T.bg} /><Text style={styles.actionPrimaryText}>Gerar PDF</Text></>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionDark} onPress={onPartilhar} disabled={busy} testID="doc-partilhar">
            <Ionicons name="share-outline" size={18} color={T.text} />
            <Text style={styles.actionDarkText}>Partilhar</Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'web' && (
          <View style={{ paddingHorizontal: T.s4 }}>
            <TouchableOpacity style={styles.actionGhost} onPress={onPrint} testID="doc-imprimir">
              <Ionicons name="print-outline" size={18} color={T.text} />
              <Text style={styles.actionGhostText}>Pré-visualizar / Imprimir</Text>
            </TouchableOpacity>
          </View>
        )}

        {doc.hasContratoRef && (
          <View style={{ paddingHorizontal: T.s4, marginTop: T.s3 }}>
            <TouchableOpacity style={styles.actionFinal} onPress={onConfirmarFinal} disabled={busy} testID="doc-confirmar-final">
              <Ionicons name="checkmark-done" size={18} color={T.bg} />
              <Text style={styles.actionFinalText}>Confirmar como final · avançar numeração</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/contratos/historico')} style={{ paddingVertical: T.s3, alignItems: 'center' }}>
              <Text style={{ color: T.accent, fontWeight: '600' }}>Ver histórico de contratos →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  head: { paddingHorizontal: T.s4, paddingTop: T.s3, paddingBottom: T.s2 },
  title: { color: T.text, fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  sub: { color: T.textDim, fontSize: 12, marginTop: 2 },
  previewWrap: {
    margin: T.s4, marginTop: T.s3,
    height: 380, borderRadius: T.r2, overflow: 'hidden',
    borderWidth: 1, borderColor: T.border, backgroundColor: '#fff',
  },
  preview: { flex: 1, backgroundColor: '#fff' },
  previewWebFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: T.s4 },
  previewWebText: { color: '#444', marginBottom: T.s3 },
  previewWebBtn: { backgroundColor: T.accent, paddingHorizontal: T.s4, paddingVertical: 10, borderRadius: T.r2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewWebBtnText: { color: T.bg, fontWeight: '700' },
  label: { color: T.textMute, fontSize: 11, letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 },
  helper: { color: T.textMute, fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, paddingHorizontal: T.s3, paddingVertical: 12,
    color: T.text, fontSize: 15,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggle: {
    flex: 1, backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    paddingVertical: 12, borderRadius: T.r2, alignItems: 'center',
  },
  toggleSel: { backgroundColor: T.accent, borderColor: T.accent },
  toggleText: { color: T.text, fontWeight: '600', fontSize: 13 },
  selectedCard: {
    backgroundColor: T.bgCard, borderColor: T.accent, borderWidth: 1,
    borderRadius: T.r2, padding: T.s3, flexDirection: 'row', alignItems: 'center', gap: T.s3,
  },
  selectedNome: { color: T.text, fontWeight: '700', fontSize: 15 },
  selectedMorada: { color: T.textDim, fontSize: 12, marginTop: 2 },
  clienteOpt: { backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1, borderRadius: T.r1, padding: T.s3, marginTop: 6 },
  clienteOptNome: { color: T.text, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: T.s2, paddingHorizontal: T.s4 },
  actionPrimary: {
    flex: 1, backgroundColor: T.accent, paddingVertical: 14, borderRadius: T.r2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionPrimaryText: { color: T.bg, fontWeight: '700', fontSize: 14, letterSpacing: 0.6 },
  actionDark: {
    backgroundColor: T.bgCard, borderColor: T.borderStrong, borderWidth: 1,
    paddingVertical: 14, paddingHorizontal: T.s4, borderRadius: T.r2,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  actionDarkText: { color: T.text, fontWeight: '700', fontSize: 14 },
  actionGhost: {
    backgroundColor: T.bgElev, borderColor: T.border, borderWidth: 1,
    paddingVertical: 12, borderRadius: T.r2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: T.s2,
  },
  actionGhostText: { color: T.text, fontWeight: '600' },
  actionFinal: {
    backgroundColor: T.success, paddingVertical: 14, borderRadius: T.r2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionFinalText: { color: T.bg, fontWeight: '700', fontSize: 13.5, letterSpacing: 0.5 },
});
