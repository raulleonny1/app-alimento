import { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import type { Alimento } from '../types';

interface Props {
  codigoInicial?: string;
  alimentoExistente?: Alimento | null;
  onGuardar: (
    data: Omit<Alimento, 'id' | 'createdAt'>,
    extras?: { cantidadIngresada: number }
  ) => Promise<void>;
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
  const [codigoBarras2, setCodigoBarras2] = useState(alimentoExistente?.codigoBarras2 ?? '');
  const [nombre, setNombre] = useState(alimentoExistente?.nombre ?? '');
  const [contieneAzucar, setContieneAzucar] = useState(
    alimentoExistente?.contieneAzucar ?? false
  );
  const [unidad, setUnidad] = useState(alimentoExistente?.unidad ?? 'unidad');
  const [tipoIngreso, setTipoIngreso] = useState<'unidad' | 'caja'>(
    alimentoExistente?.esCaja ? 'caja' : 'unidad'
  );
  const [unidadesPorCaja, setUnidadesPorCaja] = useState(
    alimentoExistente?.unidadesPorCaja?.toString() ?? '1'
  );
  const [cantidad, setCantidad] = useState(
    alimentoExistente?.stock
      ? String(
          alimentoExistente.esCaja && alimentoExistente.unidadesPorCaja
            ? Math.floor(alimentoExistente.stock / alimentoExistente.unidadesPorCaja) ||
                alimentoExistente.stock
            : alimentoExistente.stock
        )
      : '1'
  );
  const [guardando, setGuardando] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'1' | '2'>('1');

  const abrirScanner = (target: '1' | '2') => {
    setScanTarget(target);
    setMostrarScanner(true);
  };

  const handleScan = (code: string) => {
    setMostrarScanner(false);
    if (scanTarget === '1') setCodigoBarras(code);
    else setCodigoBarras2(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoBarras.trim() || !nombre.trim()) return;

    const c2 = codigoBarras2.trim();
    if (c2 && c2 === codigoBarras.trim()) {
      alert('El segundo código debe ser distinto al primero.');
      return;
    }

    const qty = parseInt(cantidad, 10);
    if (!qty || qty < 1) {
      alert('Indica cuántas unidades o cajas vas a ingresar (mínimo 1).');
      return;
    }

    const data: Omit<Alimento, 'id' | 'createdAt'> = {
      codigoBarras: codigoBarras.trim(),
      nombre: nombre.trim(),
      contieneAzucar,
      unidad,
    };

    if (c2) data.codigoBarras2 = c2;

    if (tipoIngreso === 'caja') {
      const porCaja = parseInt(unidadesPorCaja, 10);
      if (!porCaja || porCaja < 1) {
        alert('Indica cuántas unidades trae cada caja (mínimo 1).');
        return;
      }
      data.esCaja = true;
      data.unidadesPorCaja = porCaja;
      data.stock = qty * porCaja;
    } else {
      data.stock = qty;
    }

    setGuardando(true);
    await onGuardar(data, { cantidadIngresada: qty });
    setGuardando(false);
  };

  const etiquetaCantidad =
    tipoIngreso === 'caja' ? 'Cuántas cajas vas a ingresar' : 'Cuántas unidades vas a ingresar';

  return (
    <>
      <form className="card form-card" onSubmit={handleSubmit}>
        <h3>
          {titulo ??
            (alimentoExistente ? 'Editar alimento' : 'Nuevo producto con código de barras')}
        </h3>

        <label className="field">
          <span>Código de barras 1</span>
          <div className="input-with-btn">
            <input
              type="text"
              inputMode="numeric"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="Escanear o escribir"
              required
            />
            <button
              type="button"
              className="btn-scan-inline"
              onClick={() => abrirScanner('1')}
              aria-label="Escanear código 1"
            >
              📷
            </button>
          </div>
        </label>

        <label className="field">
          <span>Código de barras 2 (opcional)</span>
          <div className="input-with-btn">
            <input
              type="text"
              inputMode="numeric"
              value={codigoBarras2}
              onChange={(e) => setCodigoBarras2(e.target.value)}
              placeholder="Otro código del mismo producto"
            />
            <button
              type="button"
              className="btn-scan-inline"
              onClick={() => abrirScanner('2')}
              aria-label="Escanear código 2"
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

        <label className="field">
          <span>¿Cómo lo ingresas?</span>
          <select
            value={tipoIngreso}
            onChange={(e) => setTipoIngreso(e.target.value as 'unidad' | 'caja')}
          >
            <option value="unidad">Por unidad suelta</option>
            <option value="caja">Por caja</option>
          </select>
        </label>

        {tipoIngreso === 'caja' && (
          <label className="field">
            <span>Unidades que trae cada caja</span>
            <input
              type="number"
              min={1}
              value={unidadesPorCaja}
              onChange={(e) => setUnidadesPorCaja(e.target.value)}
              placeholder="Ej: 12 latas por caja"
              required
            />
          </label>
        )}

        <label className="field highlight-field">
          <span>{etiquetaCantidad}</span>
          <input
            type="number"
            min={1}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder={tipoIngreso === 'caja' ? 'Ej: 5 cajas' : 'Ej: 24 unidades'}
            required
          />
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
