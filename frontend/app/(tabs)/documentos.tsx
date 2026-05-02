import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../src/lib/theme';
import { DOC_TYPES } from '../../src/lib/templates';

const ICONS: Record<string, any> = {
  'proposta': 'document-text-outline',
  'contrato': 'shield-checkmark-outline',
  'tabela-b2b': 'pricetag-outline',
  'residencial': 'home-outline',
  'pos-obra': 'construct-outline',
};

export default function DocumentosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: T.s3 }}>
        <Text style={styles.intro}>
          Abre, gera o PDF e envia ao cliente. Cada documento mantém o layout premium.
        </Text>

        {DOC_TYPES.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={styles.card}
            onPress={() => router.push(`/documento/${d.key}`)}
            testID={`doc-${d.key}`}
          >
            <View style={styles.iconBox}>
              <Ionicons name={ICONS[d.key] || 'document-outline'} size={22} color={T.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo}>{d.titulo}</Text>
              <Text style={styles.subtitulo}>{d.subtitulo}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.textMute} />
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: T.s5 }}>
          <Text style={styles.sectionLabel}>HISTÓRICO</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/contratos/historico')}
            testID="abrir-historico"
          >
            <View style={styles.iconBox}>
              <Ionicons name="time-outline" size={22} color={T.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo}>Histórico de Contratos</Text>
              <Text style={styles.subtitulo}>Referências CONT-2026-XXX e estado</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.textMute} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, paddingHorizontal: T.s4 },
  intro: { color: T.textDim, fontSize: 13, lineHeight: 19, marginBottom: T.s4 },
  sectionLabel: { color: T.textMute, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginBottom: T.s3 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: T.s3,
    backgroundColor: T.bgCard, borderColor: T.border, borderWidth: 1,
    borderRadius: T.r2, padding: T.s3, marginBottom: T.s3,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: T.r2,
    backgroundColor: T.bgElev, borderWidth: 1, borderColor: T.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  titulo: { color: T.text, fontSize: 15, fontWeight: '600' },
  subtitulo: { color: T.textDim, fontSize: 12, marginTop: 2 },
});
