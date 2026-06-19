import type { Alimento, Beneficiario, Bolsa, SesionDistribucion } from '../types';
import { resumenStock } from './alimento';

export interface ConsumoStock {
  alimentoId: string;
  unidades: number;
}

export function stockDisponible(alimento: Alimento): number | null {
  if (alimento.stock == null || alimento.stock < 0) return null;
  return alimento.stock;
}

export function etiquetaStock(alimento: Alimento): string {
  const s = stockDisponible(alimento);
  if (s == null) return 'Sin stock registrado';
  if (s === 0) return 'Agotado';
  return resumenStock({ ...alimento, stock: s }) || `${s} ${alimento.unidad}`;
}

export function validarStockSuficiente(
  alimentos: Alimento[],
  consumos: ConsumoStock[]
): string | null {
  for (const { alimentoId, unidades } of consumos) {
    const a = alimentos.find((x) => x.id === alimentoId);
    if (!a) continue;
    const disp = stockDisponible(a);
    if (disp != null && unidades > disp) {
      return `No hay suficiente "${a.nombre}". Disponible: ${disp} ${a.unidad}, necesitas: ${unidades}.`;
    }
  }
  return null;
}

export interface EntregaTitular {
  fecha: number;
  items: Bolsa['items'];
}

export interface RegistroTitular {
  id: string;
  expediente: string;
  nombre: string;
  entregas: EntregaTitular[];
}

export function registroEntregasPorTitular(
  distribuciones: SesionDistribucion[],
  beneficiarios: Beneficiario[]
): RegistroTitular[] {
  const mapa = new Map<string, RegistroTitular>();

  for (const b of beneficiarios) {
    mapa.set(b.id, {
      id: b.id,
      expediente: b.expediente,
      nombre: b.nombre,
      entregas: [],
    });
  }

  const ordenadas = [...distribuciones].sort((a, b) => a.fecha - b.fecha);
  for (const d of ordenadas) {
    for (const bolsa of d.bolsas) {
      const reg = mapa.get(bolsa.beneficiarioId);
      if (!reg || bolsa.items.length === 0) continue;
      reg.entregas.push({
        fecha: d.fecha,
        items: bolsa.items,
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.expediente.localeCompare(b.expediente, 'es', { numeric: true })
  );
}

export function resumenInventario(alimentos: Alimento[]): {
  totalProductos: number;
  conStock: number;
  agotados: number;
  sinRegistrar: number;
  unidadesTotales: number;
} {
  let conStock = 0;
  let agotados = 0;
  let sinRegistrar = 0;
  let unidadesTotales = 0;

  for (const a of alimentos) {
    const s = stockDisponible(a);
    if (s == null) {
      sinRegistrar++;
      continue;
    }
    if (s === 0) agotados++;
    else conStock++;
    unidadesTotales += s;
  }

  return {
    totalProductos: alimentos.length,
    conStock,
    agotados,
    sinRegistrar,
    unidadesTotales,
  };
}

export function textoProductoUsado(
  p: SesionDistribucion['productosUsados'][0]
): string {
  if (p.esCaja && p.cajasUsadas) {
    return `${p.cajasUsadas} caja(s) × ${p.unidadesPorCaja} = ${p.cantidadTotal} ${p.unidad}`;
  }
  return `${p.cantidadTotal} ${p.unidad}`;
}
