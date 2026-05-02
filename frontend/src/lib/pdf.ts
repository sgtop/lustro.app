import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';

/**
 * Gera PDF a partir de HTML e devolve URI.
 */
export async function gerarPdf(html: string, nomeFicheiro: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Renomear ficheiro para algo mais legível na partilha
  try {
    const dir = uri.substring(0, uri.lastIndexOf('/') + 1);
    const novo = `${dir}${nomeFicheiro}.pdf`;
    // expo-file-system v55 usa moveAsync com from/to
    await FileSystem.moveAsync({ from: uri, to: novo });
    return novo;
  } catch {
    return uri;
  }
}

/**
 * Partilha PDF via share sheet nativo (WhatsApp, Email, etc).
 */
export async function partilharPdf(uri: string, dialogTitle = 'Partilhar documento') {
  try {
    if (Platform.OS === 'web') {
      // No web não há share sheet — abrir em nova janela como fallback
      if (typeof window !== 'undefined') {
        window.open(uri, '_blank');
      }
      return;
    }

    const disponivel = await Sharing.isAvailableAsync();
    if (!disponivel) {
      Alert.alert('Indisponível', 'A partilha não está disponível neste dispositivo.');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
  } catch (e: any) {
    Alert.alert('Erro a partilhar', String(e?.message || e));
  }
}

/**
 * Imprimir directo (preview do sistema) — útil em web e como alternativa em mobile.
 */
export async function imprimirHtml(html: string) {
  await Print.printAsync({ html });
}
