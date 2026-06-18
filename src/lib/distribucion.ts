import type { Beneficiario, Bolsa, ItemDistribucion, ProductoEntrada } from '../types';

export interface ResultadoDistribucion {
  bolsas: Bolsa[];
  advertencias: string[];
  sobrantes: { nombre: string; cantidad: number; unidad: string }[];
}

function beneficiariosElegibles(
  beneficiarios: Beneficiario[],
  contieneAzucar: boolean
): Beneficiario[] {
  if (contieneAzucar) {
    return beneficiarios.filter((b) => !b.tieneRestriccionAzucar);
  }
  return beneficiarios;
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

  const conOtraEnfermedad = beneficiarios.filter((b) => b.otraEnfermedad);
  if (conOtraEnfermedad.length > 0) {
    advertencias.push(
      `⚠️ ${conOtraEnfermedad.length} beneficiario(s) con otra enfermedad: ${conOtraEnfermedad
        .map((b) => `${b.nombre}${b.descripcionEnfermedad ? ` (${b.descripcionEnfermedad})` : ''}`)
        .join(', ')}. Revisar alimentos asignados.`
    );
  }

  for (const { alimento, cantidadTotal } of productos) {
    const elegibles = beneficiariosElegibles(beneficiarios, alimento.contieneAzucar);

    if (elegibles.length === 0) {
      advertencias.push(
        `"${alimento.nombre}" contiene azúcar y ningún beneficiario puede recibirlo. Sobrante: ${cantidadTotal} ${alimento.unidad}`
      );
      sobrantes.push({ nombre: alimento.nombre, cantidad: cantidadTotal, unidad: alimento.unidad });
      continue;
    }

    const porPersona = Math.floor(cantidadTotal / elegibles.length);
    const resto = cantidadTotal % elegibles.length;

    if (porPersona === 0 && cantidadTotal > 0) {
      advertencias.push(
        `"${alimento.nombre}": cantidad insuficiente (${cantidadTotal}) para ${elegibles.length} beneficiarios elegibles`
      );
      sobrantes.push({ nombre: alimento.nombre, cantidad: cantidadTotal, unidad: alimento.unidad });
      continue;
    }

    elegibles.forEach((b, index) => {
      const cantidad = porPersona + (index < resto ? 1 : 0);
      if (cantidad <= 0) return;

      const bolsa = bolsasMap.get(b.id)!;
      const item: ItemDistribucion = {
        alimentoId: alimento.id,
        codigoBarras: alimento.codigoBarras,
        nombre: alimento.nombre,
        cantidad,
        unidad: alimento.unidad,
      };
      bolsa.items.push(item);
    });

    const excluidos = beneficiarios.length - elegibles.length;
    if (excluidos > 0 && alimento.contieneAzucar) {
      advertencias.push(
        `"${alimento.nombre}": ${excluidos} beneficiario(s) excluido(s) por restricción de azúcar/diabetes`
      );
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
