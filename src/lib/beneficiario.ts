import type { Beneficiario, BeneficiarioInput } from '../types';

/** Datos de la hoja de firmas (referencia) */
export const BENEFICIARIOS_HOJA: BeneficiarioInput[] = [
  { expediente: '28094015', nombre: 'Pedro Del Rio Rodríguez', dni: '06518286V', telefono: '916774090', numMiembrosFamilia: 2, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094106', nombre: 'Mónica Moreno Cañete', dni: '47486186H', telefono: '672111589', numMiembrosFamilia: 6, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094017', nombre: 'Norka Lizbeth Hernández De Zabala', dni: 'Y7206625A', telefono: '624029470', numMiembrosFamilia: 5, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094018', nombre: 'Luis Arauco Marquez', dni: '18541631C', telefono: '624715408', numMiembrosFamilia: 4, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094019', nombre: 'Mari Carmen Cañete Cruz', dni: '51325063B', telefono: '637362626', numMiembrosFamilia: 2, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094020', nombre: 'Laura Martín Corchado', dni: '52106505M', telefono: '666652066', numMiembrosFamilia: 3, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094021', nombre: 'Enriqueta Mosibe Ensara', dni: '51245425E', telefono: '669309747', numMiembrosFamilia: 4, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094022', nombre: 'Ricardo Sifuentes Yanac', dni: '123287241', telefono: '604958422', numMiembrosFamilia: 1, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094100', nombre: 'Felipe Linares Pisco', dni: '125150149', telefono: '614567372', numMiembrosFamilia: 2, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094101', nombre: 'Génesis Doménica Núñez Coello', dni: 'X8087389Z', telefono: '643284115', numMiembrosFamilia: 2, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28094102', nombre: 'Sonia Sifuentes Yanac', dni: '123269119', telefono: '624836790', numMiembrosFamilia: 2, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28096058', nombre: 'Vanesa Moreno Cañete', dni: '47518523V', telefono: '645159522', numMiembrosFamilia: 3, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
  { expediente: '28096059', nombre: 'Raúl Isaías León Jiménez', dni: 'Z4104240X', telefono: '642799370', numMiembrosFamilia: 0, tieneDiabetesEnFamilia: false, sensibleAzucarEnFamilia: false, otraEnfermedad: false, descripcionEnfermedad: '' },
];

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
