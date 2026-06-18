export interface Familiar {
  nombre: string;
  tieneDiabetes: boolean;
  sensibleAzucar: boolean;
}

export interface Beneficiario {
  id: string;
  nombre: string;
  familiares: Familiar[];
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
