import type { Beneficiario, BeneficiarioInput } from '../types';

/** Total según hoja de firmas en public/beneficiados.jpeg */
export const TOTAL_MIEMBROS_HOJA = 36;
export const TOTAL_TITULARES_HOJA = 13;

/** Un titular por expediente (hoja de firmas = 13 familias de hogar) */
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

export function totalMiembrosFamilia(titulares: Beneficiario[]): number {
  return titulares.reduce((s, b) => s + miembrosUF(b.numMiembrosFamilia), 0);
}

/** N° miembros unidad familiar tal como en la hoja (0 = solo titular) */
export function miembrosUF(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) return 0;
  return Math.floor(valor);
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
