import { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import type { Alimento } from '../types';

interface Props {
  codigoInicial?: string;
  alimentoExistente?: Alimento | null;
  onGuardar: (data: Omit<Alimento, 'id' | 'createdAt'>) => Promise<void>;
  onCancelar: () => void;
  titulo?: string;
}

export function FormularioAlimento({
  codigoInicial,
  alimentoExistente,
  onGuardar,
  onCancelar,
  titulo,
}: Props) {
  const [codigoBarras, setCodigoBarras] = useState(
    alimentoExistente?.codigoBarras ?? codigoInicial ?? ''
  );
  const [nombre, setNombre] = useState(alimentoExistente?.nombre ?? '');
  const [contieneAzucar, setContieneAzucar] = useState(
    alimentoExistente?.contieneAzucar ?? false
  );
  const [unidad, setUnidad] = useState(alimentoExistente?.unidad ?? 'unidad');
  const [guardando, setGuardando] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);

  const handleScan = (code: string) => {
    setMostrarScanner(false);
    setCodigoBarras(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoBarras.trim() || !nombre.trim()) return;
    setGuardando(true);
    await onGuardar({
      codigoBarras: codigoBarras.trim(),
      nombre: nombre.trim(),
      contieneAzucar,
      unidad,
    });
    setGuardando(false);
  };

  return (
    <>
      <form className="card form-card" onSubmit={handleSubmit}>
        <h3>
          {titulo ??
            (alimentoExistente ? 'Editar alimento' : 'Nuevo producto con código de barras')}
        </h3>

        <label className="field">
          <span>Código de barras</span>
          <div className="input-with-btn">
            <input
              type="text"
              inputMode="numeric"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="Escanear o escribir código"
              required
            />
            <button
              type="button"
              className="btn-scan-inline"
              onClick={() => setMostrarScanner(true)}
              aria-label="Escanear código"
            >
              📷
            </button>
          </div>
        </label>

        <label className="field">
          <span>Nombre del producto</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Arroz 1kg"
            required
            autoFocus={!!codigoBarras && !alimentoExistente}
          />
        </label>

        <label className="field">
          <span>Unidad de medida</span>
          <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
            <option value="unidad">Unidad</option>
            <option value="kg">Kilogramo (kg)</option>
            <option value="g">Gramo (g)</option>
            <option value="litro">Litro</option>
            <option value="paquete">Paquete</option>
            <option value="lata">Lata</option>
          </select>
        </label>

        <label className="checkbox-field highlight">
          <input
            type="checkbox"
            checked={contieneAzucar}
            onChange={(e) => setContieneAzucar(e.target.checked)}
          />
          <span>⚠️ Contiene azúcar (no apto para diabéticos)</span>
        </label>

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>

      {mostrarScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setMostrarScanner(false)} />
      )}
    </>
  );
}
