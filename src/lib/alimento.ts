import type { Alimento } from '../types';

export function esProductoCaja(alimento: Alimento): boolean {
  return Boolean(alimento.esCaja && alimento.unidadesPorCaja && alimento.unidadesPorCaja > 0);
}

/** Convierte cajas (o unidades sueltas) a unidades totales para repartir */
export function unidadesTotales(alimento: Alimento, cantidadIngresada: number): number {
  if (esProductoCaja(alimento)) {
    return cantidadIngresada * alimento.unidadesPorCaja!;
  }
  return cantidadIngresada;
}

export function etiquetaCantidadIngreso(alimento: Alimento): string {
  return esProductoCaja(alimento) ? 'cajas' : alimento.unidad;
}

export function resumenCantidad(alimento: Alimento, cantidadIngresada: number): string {
  if (esProductoCaja(alimento)) {
    const total = unidadesTotales(alimento, cantidadIngresada);
    return `${cantidadIngresada} caja(s) × ${alimento.unidadesPorCaja} = ${total} unidades`;
  }
  return `${cantidadIngresada} ${alimento.unidad}`;
}

export function normalizarAlimento(data: Record<string, unknown>): Partial<Alimento> {
  const esCaja = Boolean(data.esCaja);
  const unidadesPorCaja = esCaja && data.unidadesPorCaja
    ? Math.max(1, Math.floor(Number(data.unidadesPorCaja)))
    : undefined;
  return {
    esCaja: esCaja && !!unidadesPorCaja,
    unidadesPorCaja,
  };
}
