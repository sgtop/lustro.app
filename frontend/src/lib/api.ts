const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function http<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type Cliente = {
  id: string;
  nome: string;
  morada?: string;
  localidade?: string;
  contacto?: string;
  email?: string;
  nif?: string;
  notas?: string;
  criado_em: string;
};

export type Visita = {
  id: string;
  cliente_id: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  notas?: string;
  estado: string;
  criado_em: string;
};

export type Contrato = {
  id: string;
  ref: string;
  cliente_id?: string;
  cliente_nome?: string;
  valor?: number;
  periodicidade?: string;
  estado: string; // gerado | assinado
  data?: string;
  final?: boolean;
  criado_em: string;
};

export const api = {
  // Clientes
  listClientes: () => http<Cliente[]>('/clientes'),
  getCliente: (id: string) => http<Cliente>(`/clientes/${id}`),
  createCliente: (data: Partial<Cliente>) =>
    http<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  updateCliente: (id: string, data: Partial<Cliente>) =>
    http<Cliente>(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCliente: (id: string) =>
    http<{ ok: boolean }>(`/clientes/${id}`, { method: 'DELETE' }),

  // Visitas
  listVisitas: (params?: { data?: string; cliente_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.data) q.set('data', params.data);
    if (params?.cliente_id) q.set('cliente_id', params.cliente_id);
    const qs = q.toString();
    return http<Visita[]>(`/visitas${qs ? '?' + qs : ''}`);
  },
  getVisita: (id: string) => http<Visita>(`/visitas/${id}`),
  createVisita: (data: Partial<Visita>) =>
    http<Visita>('/visitas', { method: 'POST', body: JSON.stringify(data) }),
  updateVisita: (id: string, data: Partial<Visita>) =>
    http<Visita>(`/visitas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVisita: (id: string) =>
    http<{ ok: boolean }>(`/visitas/${id}`, { method: 'DELETE' }),

  // Contratos
  listContratos: () => http<Contrato[]>('/contratos'),
  proximoNumero: () => http<{ ano: number; numero: number; ref: string }>(
    '/contratos/proximo-numero'
  ),
  createContrato: (data: Partial<Contrato>) =>
    http<Contrato>('/contratos', { method: 'POST', body: JSON.stringify(data) }),
  updateContrato: (id: string, data: Partial<Contrato> & { confirmar_final?: boolean }) =>
    http<Contrato>(`/contratos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContrato: (id: string) =>
    http<{ ok: boolean }>(`/contratos/${id}`, { method: 'DELETE' }),
};
