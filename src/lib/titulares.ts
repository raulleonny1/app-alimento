import type { Beneficiario } from '../types';

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
  return titulares.reduce((s, b) => s + b.numMiembrosFamilia, 0);
}
