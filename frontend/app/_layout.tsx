import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { T } from '../src/lib/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: T.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: T.bg },
            headerTintColor: T.text,
            headerTitleStyle: { fontWeight: '600', letterSpacing: 1 },
            contentStyle: { backgroundColor: T.bg },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="cliente/new" options={{ title: 'Novo Cliente', presentation: 'modal' }} />
          <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
          <Stack.Screen name="visita/new" options={{ title: 'Nova Visita', presentation: 'modal' }} />
          <Stack.Screen name="documento/[type]" options={{ title: 'Documento' }} />
          <Stack.Screen name="contratos/historico" options={{ title: 'Histórico de Contratos' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
