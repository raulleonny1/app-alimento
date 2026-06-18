import type { Beneficiario, BeneficiarioInput } from '../types';

export function calcularRestriccionAzucar(data: Pick<BeneficiarioInput, 'tieneDiabetesEnFamilia' | 'sensibleAzucarEnFamilia'>): boolean {
  return data.tieneDiabetesEnFamilia || data.sensibleAzucarEnFamilia;
}

export function normalizarBeneficiario(id: string, raw: Record<string, unknown>): Beneficiario {
  const familiares = Array.isArray(raw.familiares) ? raw.familiares as { tieneDiabetes?: boolean; sensibleAzucar?: boolean }[] : [];

  const tieneDiabetesEnFamilia = Boolean(raw.tieneDiabetesEnFamilia) ||
    familiares.some((f) => f.tieneDiabetes);
  const sensibleAzucarEnFamilia = Boolean(raw.sensibleAzucarEnFamilia) ||
    familiares.some((f) => f.sensibleAzucar);

  return {
    id,
    expediente: String(raw.expediente ?? ''),
    nombre: String(raw.nombre ?? ''),
    dni: String(raw.dni ?? ''),
    telefono: String(raw.telefono ?? ''),
    numMiembrosFamilia: Number(raw.numMiembrosFamilia ?? familiares.length ?? 0),
    tieneDiabetesEnFamilia,
    sensibleAzucarEnFamilia,
    otraEnfermedad: Boolean(raw.otraEnfermedad),
    descripcionEnfermedad: String(raw.descripcionEnfermedad ?? ''),
    tieneRestriccionAzucar: Boolean(raw.tieneRestriccionAzucar) || calcularRestriccionAzucar({ tieneDiabetesEnFamilia, sensibleAzucarEnFamilia }),
    createdAt: Number(raw.createdAt ?? 0),
  };
}

export function etiquetasSalud(b: Beneficiario): string[] {
  const tags: string[] = [];
  if (b.tieneDiabetesEnFamilia) tags.push('Diabetes en familia');
  if (b.sensibleAzucarEnFamilia) tags.push('Sensible al azúcar');
  if (b.otraEnfermedad && b.descripcionEnfermedad.trim()) {
    tags.push(b.descripcionEnfermedad.trim());
  } else if (b.otraEnfermedad) {
    tags.push('Otra enfermedad');
  }
  return tags;
}
