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
  /** Segundo código de barras opcional (mismo producto) */
  codigoBarras2?: string;
  nombre: string;
  /** Si el producto contiene azúcar o es perjudicial para diabéticos */
  contieneAzucar: boolean;
  unidad: string;
  /** Opcional: se reparte por cajas y cada caja trae N unidades */
  esCaja?: boolean;
  unidadesPorCaja?: number;
  /** Unidades totales disponibles (cajas × unidades/caja o unidades sueltas) */
  stock?: number;
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

export interface ProductoUsado {
  alimentoId: string;
  codigoBarras: string;
  nombre: string;
  cantidadTotal: number;
  unidad: string;
  contieneAzucar: boolean;
  esCaja?: boolean;
  cajasUsadas?: number;
  unidadesPorCaja?: number;
}

export interface SesionDistribucion {
  id: string;
  fecha: number;
  totalTitulares: number;
  totalMiembrosFamilia: number;
  /** @deprecated usar totalTitulares */
  totalBeneficiarios: number;
  productosUsados: ProductoUsado[];
  bolsas: Bolsa[];
  advertencias: string[];
  sobrantes: { nombre: string; cantidad: number; unidad: string }[];
  notas: string;
}

export interface ProductoEntrada {
  alimento: Alimento;
  /** Unidades totales a repartir (cajas × unidades/caja si aplica) */
  cantidadTotal: number;
  /** Lo que ingresó el usuario (cajas o unidades) */
  cantidadIngresada: number;
}
