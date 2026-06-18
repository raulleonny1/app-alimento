export interface BeneficiarioInput {
  expediente: string;
  nombre: string;
  dni: string;
  telefono: string;
  numMiembrosFamilia: number;
  tieneDiabetesEnFamilia: boolean;
  sensibleAzucarEnFamilia: boolean;
  otraEnfermedad: boolean;
  descripcionEnfermedad: string;
}

export interface Beneficiario extends BeneficiarioInput {
  id: string;
  /** true si algún familiar tiene diabetes o es sensible al azúcar */
  tieneRestriccionAzucar: boolean;
  createdAt: number;
}

export interface Alimento {
  id: string;
  codigoBarras: string;
  nombre: string;
  /** Si el producto contiene azúcar o es perjudicial para diabéticos */
  contieneAzucar: boolean;
  unidad: string;
  createdAt: number;
}

export interface ItemDistribucion {
  alimentoId: string;
  codigoBarras: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface Bolsa {
  beneficiarioId: string;
  beneficiarioNombre: string;
  items: ItemDistribucion[];
}

export interface SesionDistribucion {
  id: string;
  fecha: number;
  totalBeneficiarios: number;
  bolsas: Bolsa[];
  notas: string;
}

export interface ProductoEntrada {
  alimento: Alimento;
  cantidadTotal: number;
}
