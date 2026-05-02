// Helpers para localidade e datas
import { format, addDays } from 'date-fns';

const KNOWN_LOCALIDADES = [
  'Lisboa', 'Oeiras', 'Cascais', 'Sintra', 'Estoril', 'Carcavelos',
  'Paço de Arcos', 'Algés', 'Linda-a-Velha', 'Carnaxide', 'Queluz',
  'Belém', 'Parede', 'São Domingos de Rana', 'Alfragide',
  'Amadora', 'Mafra', 'Loures', 'Odivelas', 'Barreiro', 'Almada',
  'Setúbal', 'Seixal', 'Montijo', 'Sesimbra',
  'Porto', 'Braga', 'Coimbra', 'Aveiro', 'Faro', 'Évora',
  'Algarve', 'Caxias',
];

/**
 * Extrai a localidade da morada como fallback.
 * Procura por nomes conhecidos primeiro e depois usa heurística.
 */
export function extractLocalidade(morada?: string): string {
  if (!morada) return '';
  const trimmed = morada.trim();
  if (!trimmed) return '';

  // 1) match com lista conhecida
  for (const loc of KNOWN_LOCALIDADES) {
    const re = new RegExp(`\\b${loc.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (re.test(trimmed)) return loc;
  }

  // 2) Procurar por código postal + localidade (ex: "2780-235 Oeiras")
  const cpMatch = trimmed.match(/\d{4}-\d{3}\s+([A-Za-zÀ-ÿ\s]+)$/);
  if (cpMatch) return cpMatch[1].trim();

  // 3) último segmento separado por vírgulas
  const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];

  return '';
}

export function clienteLocalidade(c: { morada?: string; localidade?: string }): string {
  if (c.localidade && c.localidade.trim()) return c.localidade.trim();
  return extractLocalidade(c.morada);
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function tomorrowISO(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

export function fmtDateLong(d: string): string {
  // d = YYYY-MM-DD
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
