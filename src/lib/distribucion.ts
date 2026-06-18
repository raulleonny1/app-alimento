import type { Alimento, Beneficiario, Bolsa, ProductoEntrada } from '../types';
import { esProductoCaja } from './alimento';

export interface ResultadoDistribucion {
  bolsas: Bolsa[];
  advertencias: string[];
  sobrantes: { nombre: string; cantidad: number; unidad: string }[];
}

function esAzucarPura(nombre: string): boolean {
  const n = nombre.toLowerCase();
  return /az[uú]car|funda|saco|bolsa/.test(n);
}

function esAzucarLigera(nombre: string): boolean {
  const n = nombre.toLowerCase();
  return /galleta|maría|maria|dulce|mermelada|bizcocho/.test(n);
}

/** Cuota de azúcar para familia con diabetes: mínimo 1, máximo según tipo de producto */
function cuotaAzucarDiabetico(alimento: Alimento, equitativa: number): number {
  if (equitativa <= 0) return 0;
  if (esAzucarLigera(alimento.nombre)) return equitativa;
  if (esAzucarPura(alimento.nombre)) return 1;
  return Math.min(equitativa, 1);
}

function repartirEquitativamente(cantidadTotal: number, n: number): number[] {
  const base = Math.floor(cantidadTotal / n);
  const extra = cantidadTotal % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

function distribuirProducto(
  alimento: Alimento,
  cantidadTotal: number,
  beneficiarios: Beneficiario[],
  bolsasMap: Map<string, Bolsa>
): number {
  const n = beneficiarios.length;
  if (n === 0 || cantidadTotal <= 0) return cantidadTotal;

  const cuotas = repartirEquitativamente(cantidadTotal, n);
  const asignado = new Map<string, number>();
  let sobrante = 0;

  beneficiarios.forEach((b, i) => {
    let cant = cuotas[i];
    if (alimento.contieneAzucar && b.tieneRestriccionAzucar) {
      const reducida = cuotaAzucarDiabetico(alimento, cant);
      sobrante += cant - reducida;
      cant = reducida;
    }
    asignado.set(b.id, cant);
  });

  const sinRestriccion = beneficiarios.filter((b) => !b.tieneRestriccionAzucar);
  let idx = 0;
  while (sobrante > 0 && sinRestriccion.length > 0) {
    const b = sinRestriccion[idx % sinRestriccion.length];
    asignado.set(b.id, (asignado.get(b.id) ?? 0) + 1);
    sobrante--;
    idx++;
  }

  const diabeticos = beneficiarios.filter((b) => b.tieneRestriccionAzucar);
  for (const b of diabeticos) {
    if (!alimento.contieneAzucar) continue;
    const actual = asignado.get(b.id) ?? 0;
    if (actual > 0) continue;

    const donante = sinRestriccion.find((s) => (asignado.get(s.id) ?? 0) > 1)
      ?? sinRestriccion.find((s) => (asignado.get(s.id) ?? 0) > 0);
    if (donante) {
      asignado.set(donante.id, (asignado.get(donante.id) ?? 0) - 1);
      asignado.set(b.id, 1);
      sobrante = Math.max(0, sobrante - 1);
    } else if (sobrante > 0) {
      asignado.set(b.id, 1);
      sobrante--;
    }
  }

  for (const b of beneficiarios) {
    const cantidad = asignado.get(b.id) ?? 0;
    if (cantidad <= 0) continue;
    bolsasMap.get(b.id)!.items.push({
      alimentoId: alimento.id,
      codigoBarras: alimento.codigoBarras,
      nombre: alimento.nombre,
      cantidad,
      unidad: esProductoCaja(alimento) ? 'unidad' : alimento.unidad,
    });
  }

  return sobrante;
}

export function calcularDistribucion(
  productos: ProductoEntrada[],
  beneficiarios: Beneficiario[]
): ResultadoDistribucion {
  const advertencias: string[] = [];
  const sobrantes: { nombre: string; cantidad: number; unidad: string }[] = [];

  const bolsasMap = new Map<string, Bolsa>();
  for (const b of beneficiarios) {
    bolsasMap.set(b.id, {
      beneficiarioId: b.id,
      beneficiarioNombre: b.nombre,
      items: [],
    });
  }

  for (const { alimento, cantidadTotal } of productos) {
    const resto = distribuirProducto(alimento, cantidadTotal, beneficiarios, bolsasMap);
    if (resto > 0) {
      sobrantes.push({
        nombre: alimento.nombre,
        cantidad: resto,
        unidad: esProductoCaja(alimento) ? 'unidad' : alimento.unidad,
      });
    }
  }

  const bolsas = Array.from(bolsasMap.values()).filter((b) => b.items.length > 0);
  return { bolsas, advertencias, sobrantes };
}

export function resumenDistribucion(bolsas: Bolsa[]): {
  totalBolsas: number;
  totalItems: number;
} {
  return {
    totalBolsas: bolsas.length,
    totalItems: bolsas.reduce((sum, b) => sum + b.items.length, 0),
  };
}
