import type { Alimento } from '../types';

export function codigosDeAlimento(alimento: Pick<Alimento, 'codigoBarras' | 'codigoBarras2'>): string[] {
  const c1 = alimento.codigoBarras?.trim();
  const c2 = alimento.codigoBarras2?.trim();
  const lista: string[] = [];
  if (c1) lista.push(c1);
  if (c2 && c2 !== c1) lista.push(c2);
  return lista;
}

export function coincideCodigo(
  alimento: Pick<Alimento, 'codigoBarras' | 'codigoBarras2'>,
  codigo: string
): boolean {
  const c = codigo.trim();
  return codigosDeAlimento(alimento).includes(c);
}

export function etiquetaCodigos(alimento: Pick<Alimento, 'codigoBarras' | 'codigoBarras2'>): string {
  return codigosDeAlimento(alimento).join(' · ');
}

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
    return `${cantidadIngresada} caja(s) × ${alimento.unidadesPorCaja} ${alimento.unidad} = ${total} ${alimento.unidad}`;
  }
  return `${cantidadIngresada} ${alimento.unidad}`;
}

export function mensajeCodigoDuplicado(alimento: Alimento, codigo: string): string {
  return `El código ${codigo} ya está registrado como "${alimento.nombre}". ¿Deseas editarlo?`;
}

export function resumenStock(alimento: Alimento): string {
  if (!alimento.stock || alimento.stock < 1) return '';
  if (esProductoCaja(alimento) && alimento.unidadesPorCaja) {
    const cajas = Math.floor(alimento.stock / alimento.unidadesPorCaja);
    return `Ingresado: ${cajas} caja(s) (${alimento.stock} ${alimento.unidad})`;
  }
  return `Ingresado: ${alimento.stock} ${alimento.unidad}`;
}

export function normalizarAlimento(data: Record<string, unknown>): Partial<Alimento> {
  const esCaja = Boolean(data.esCaja);
  const unidadesPorCaja = esCaja && data.unidadesPorCaja
    ? Math.max(1, Math.floor(Number(data.unidadesPorCaja)))
    : undefined;
  return {
    esCaja: esCaja && !!unidadesPorCaja,
    unidadesPorCaja,
    codigoBarras2: data.codigoBarras2 ? String(data.codigoBarras2).trim() : undefined,
    exclusivoDiabeticos: Boolean(data.exclusivoDiabeticos),
  };
}
