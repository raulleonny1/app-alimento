import type { Beneficiario, BeneficiarioInput } from '../types';

export const TOTAL_TITULARES_HOJA = 13;

/** Un titular por expediente (hoja de firmas) */
export function deduplicarTitulares(lista: Beneficiario[]): Beneficiario[] {
  const porExpediente = new Map<string, Beneficiario>();

  for (const b of lista) {
    const clave = b.expediente.trim() || b.id;
    const previo = porExpediente.get(clave);
    if (!previo || b.createdAt >= previo.createdAt) {
      porExpediente.set(clave, b);
    }
  }

  return Array.from(porExpediente.values()).sort((a, b) =>
    a.expediente.localeCompare(b.expediente, 'es', { numeric: true })
  );
}

/** Valor de la columna "N° miembros UF" de la hoja (por familia, no sumar todas) */
export function miembrosUF(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) return 0;
  return Math.floor(valor);
}

/** Texto para mostrar personas en ese hogar (0 en hoja = solo el titular) */
export function textoPersonasHogar(numMiembros: number): string {
  const n = miembrosUF(numMiembros);
  if (n === 0) return '1 persona (solo titular)';
  if (n === 1) return '1 persona en el hogar';
  return `${n} personas en el hogar`;
}

export function datosDesactualizados(
  firestore: Beneficiario[],
  publica: BeneficiarioInput[]
): boolean {
  if (firestore.length !== publica.length) return true;

  const expedientes = firestore.map((d) => d.expediente);
  if (new Set(expedientes).size !== expedientes.length) return true;

  const mapa = new Map(publica.map((p) => [p.expediente, p]));

  for (const b of firestore) {
    const hoja = mapa.get(b.expediente);
    if (!hoja) return true;
    if (miembrosUF(b.numMiembrosFamilia) !== miembrosUF(hoja.numMiembrosFamilia)) return true;
    if (b.nombre.trim() !== hoja.nombre.trim()) return true;
    if (b.dni.trim().toUpperCase() !== hoja.dni.trim().toUpperCase()) return true;
    if (b.telefono.trim() !== hoja.telefono.trim()) return true;
  }

  return false;
}
