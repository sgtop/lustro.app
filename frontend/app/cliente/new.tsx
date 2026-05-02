import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { T } from '../../src/lib/theme';
import { api } from '../../src/lib/api';
import { extractLocalidade } from '../../src/lib/locality';

export default function NovoCliente() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [contacto, setContacto] = useState('');
  const [email, setEmail] = useState('');
  const [nif, setNif] = useState('');
  const [notas, setNotas] = useState('');
  const [a, setA] = useState(false);

  const localidadeAuto = extractLocalidade(morada);

  const guardar = async () => {
    if (!nome.trim()) {
      Alert.alert('Campo obrigatório', 'Indica o nome do cliente.');
      return;
    }
    setA(true);
    try {
      await api.createCliente({
        nome: nome.trim(),
        morada: morada.trim(),
        localidade: (localidade.trim() || extractLocalidade(morada)),
        contacto: contacto.trim(),
        email: email.trim(),
        nif: nif.trim(),
        notas: notas.trim(),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha a guardar');
    } finally {
      setA(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: T.s4, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Field label="Nome / Empresa *" value={nome} onChangeText={setNome} testID="cli-nome" />
        <Field label="Morada" value={morada} onChangeText={setMorada} testID="cli-morada" multiline />
        <Field
          label="Localidade"
          value={localidade}
          onChangeText={setLocalidade}
          placeholder={localidadeAuto ? `(auto: ${localidadeAuto})` : 'Ex: Oeiras'}
          testID="cli-localidade"
        />
        <Field label="Contacto" value={contacto} onChangeText={setContacto} keyboardType="phone-pad" testID="cli-contacto" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" testID="cli-email" />
        <Field label="NIF" value={nif} onChangeText={setNif} keyboardType="numeric" testID="cli-nif" />
        <Field label="Notas" value={notas} onChangeText={setNotas} multiline testID="cli-notas" />

        <TouchableOpacity style={[styles.btn, a && { opacity: 0.6 }]} onPress={guardar} disabled={a} testID="cli-save">
          <Text style={styles.btnText}>{a ? 'A guardar...' : 'Guardar Cliente'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Field(props: any) {
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
  label: { color: T.textDim, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, paddingHorizontal: T.s3, paddingVertical: 12,
    color: T.text, fontSize: 15,
  },
  btn: {
    backgroundColor: T.accent, paddingVertical: 14, borderRadius: T.r2,
    alignItems: 'center', marginTop: T.s3,
  },
  btnText: { color: T.bg, fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});
