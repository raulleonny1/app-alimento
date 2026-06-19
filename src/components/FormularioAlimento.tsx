import { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import type { Alimento } from '../types';
import { mensajeCodigoDuplicado } from '../lib/alimento';

interface Props {
  codigoInicial?: string;
  alimentoExistente?: Alimento | null;
  verificarCodigosUnicos?: (
    codigoBarras: string,
    codigoBarras2?: string,
    excluirId?: string
  ) => Promise<{ alimento: Alimento; codigo: string } | null>;
  onEditarExistente?: (alimento: Alimento) => void;
  onGuardar: (
    data: Omit<Alimento, 'id' | 'createdAt'>,
    extras?: { cantidadIngresada: number }
  ) => Promise<void>;
  onCancelar: () => void;
  titulo?: string;
}

const UNIDADES = [
  { value: 'lata', label: 'Lata' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'litro', label: 'Litro' },
];

function numCajasDesdeStock(a: Alimento): string {
  if (!a.stock || !a.esCaja || !a.unidadesPorCaja) return '1';
  return String(Math.max(1, Math.floor(a.stock / a.unidadesPorCaja)));
}

export function FormularioAlimento({
  codigoInicial,
  alimentoExistente,
  verificarCodigosUnicos,
  onEditarExistente,
  onGuardar,
  onCancelar,
  titulo,
}: Props) {
  const vieneEnCajas = alimentoExistente?.esCaja ?? true;

  const [codigoBarras, setCodigoBarras] = useState(
    alimentoExistente?.codigoBarras ?? codigoInicial ?? ''
  );
  const [codigoBarras2, setCodigoBarras2] = useState(alimentoExistente?.codigoBarras2 ?? '');
  const [nombre, setNombre] = useState(alimentoExistente?.nombre ?? '');
  const [contieneAzucar, setContieneAzucar] = useState(
    alimentoExistente?.contieneAzucar ?? false
  );
  const [exclusivoDiabeticos, setExclusivoDiabeticos] = useState(
    alimentoExistente?.exclusivoDiabeticos ?? false
  );
  const [esCaja, setEsCaja] = useState(vieneEnCajas);
  const [unidad, setUnidad] = useState(alimentoExistente?.unidad ?? 'lata');
  const [numCajas, setNumCajas] = useState(
    alimentoExistente ? (vieneEnCajas ? numCajasDesdeStock(alimentoExistente) : '1') : '1'
  );
  const [unidadesPorCaja, setUnidadesPorCaja] = useState(
    alimentoExistente?.unidadesPorCaja?.toString() ?? '12'
  );
  const [cantidadSueltas, setCantidadSueltas] = useState(
    alimentoExistente && !vieneEnCajas ? String(alimentoExistente.stock ?? 1) : '1'
  );
  const [guardando, setGuardando] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'1' | '2'>('1');

  const cajas = parseInt(numCajas, 10) || 0;
  const porCaja = parseInt(unidadesPorCaja, 10) || 0;
  const totalUnidades = esCaja ? cajas * porCaja : parseInt(cantidadSueltas, 10) || 0;
  const etiquetaUnidad = UNIDADES.find((u) => u.value === unidad)?.label.toLowerCase() ?? unidad;

  const abrirScanner = (target: '1' | '2') => {
    setScanTarget(target);
    setMostrarScanner(true);
  };

  const handleScan = async (code: string) => {
    setMostrarScanner(false);
    const c = code.trim();
    if (!c) return;

    if (verificarCodigosUnicos) {
      const dup = await verificarCodigosUnicos(c, undefined, alimentoExistente?.id);
      if (dup) {
        if (confirm(mensajeCodigoDuplicado(dup.alimento, dup.codigo))) {
          onEditarExistente?.(dup.alimento);
        }
        return;
      }
    }

    if (scanTarget === '1') setCodigoBarras(c);
    else setCodigoBarras2(c);
  };

  const revisarCodigoDuplicado = async (codigo: string) => {
    const c = codigo.trim();
    if (!c || !verificarCodigosUnicos) return;

    const dup = await verificarCodigosUnicos(c, undefined, alimentoExistente?.id);
    if (!dup || dup.codigo !== c) return;

    if (confirm(mensajeCodigoDuplicado(dup.alimento, dup.codigo))) {
      onEditarExistente?.(dup.alimento);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoBarras.trim() || !nombre.trim()) return;

    const c2 = codigoBarras2.trim();
    if (c2 && c2 === codigoBarras.trim()) {
      alert('El segundo código debe ser distinto al primero.');
      return;
    }

    if (verificarCodigosUnicos) {
      const dup = await verificarCodigosUnicos(
        codigoBarras.trim(),
        c2 || undefined,
        alimentoExistente?.id
      );
      if (dup) {
        if (confirm(mensajeCodigoDuplicado(dup.alimento, dup.codigo))) {
          onEditarExistente?.(dup.alimento);
        }
        return;
      }
    }

    const data: Omit<Alimento, 'id' | 'createdAt'> = {
      codigoBarras: codigoBarras.trim(),
      nombre: nombre.trim(),
      contieneAzucar,
      exclusivoDiabeticos,
      unidad,
    };
    if (c2) data.codigoBarras2 = c2;

    let cantidadIngresada = 1;

    if (esCaja) {
      if (cajas < 1) {
        alert('Indica cuántas cajas recibiste (mínimo 1).');
        return;
      }
      if (porCaja < 1) {
        alert(`Indica cuántas ${etiquetaUnidad}s trae cada caja (mínimo 1).`);
        return;
      }
      data.esCaja = true;
      data.unidadesPorCaja = porCaja;
      data.stock = cajas * porCaja;
      cantidadIngresada = cajas;
    } else {
      const sueltas = parseInt(cantidadSueltas, 10);
      if (!sueltas || sueltas < 1) {
        alert('Indica cuántas unidades recibiste (mínimo 1).');
        return;
      }
      data.stock = sueltas;
      cantidadIngresada = sueltas;
    }

    setGuardando(true);
    await onGuardar(data, { cantidadIngresada });
    setGuardando(false);
  };

  return (
    <>
      <form className="card form-card" onSubmit={handleSubmit}>
        {titulo !== '' && (
          <h3>
            {titulo ??
              (alimentoExistente ? 'Editar alimento' : 'Nuevo producto con código de barras')}
          </h3>
        )}

        <label className="field">
          <span>Código de barras 1</span>
          <div className="input-with-btn">
            <input
              type="text"
              inputMode="numeric"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              onBlur={(e) => revisarCodigoDuplicado(e.target.value)}
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
              onBlur={(e) => revisarCodigoDuplicado(e.target.value)}
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
            placeholder="Ej: Atún en lata"
            required
            autoFocus={!!codigoBarras && !alimentoExistente}
          />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={esCaja}
            onChange={(e) => setEsCaja(e.target.checked)}
          />
          <span>Viene en cajas (lo habitual)</span>
        </label>

        {esCaja ? (
          <>
            <label className="field highlight-field">
              <span>Cuántas cajas recibiste</span>
              <input
                type="number"
                min={1}
                value={numCajas}
                onChange={(e) => setNumCajas(e.target.value)}
                placeholder="Ej: 5 cajas"
                required
              />
            </label>

            <label className="field">
              <span>Qué trae cada caja</span>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
                {UNIDADES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field highlight-field">
              <span>Cuántas {etiquetaUnidad}s trae cada caja</span>
              <input
                type="number"
                min={1}
                value={unidadesPorCaja}
                onChange={(e) => setUnidadesPorCaja(e.target.value)}
                placeholder={`Ej: 12 ${etiquetaUnidad}s por caja`}
                required
              />
            </label>

            {cajas > 0 && porCaja > 0 && (
              <p className="total-ingreso">
                Total: <strong>{cajas} caja(s)</strong> × <strong>{porCaja} {etiquetaUnidad}(s)</strong>{' '}
                = <strong>{totalUnidades} {etiquetaUnidad}(s)</strong>
              </p>
            )}
          </>
        ) : (
          <>
            <label className="field">
              <span>Unidad de medida</span>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
                {UNIDADES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field highlight-field">
              <span>Cuántas unidades recibiste</span>
              <input
                type="number"
                min={1}
                value={cantidadSueltas}
                onChange={(e) => setCantidadSueltas(e.target.value)}
                placeholder="Ej: 24 unidades sueltas"
                required
              />
            </label>
          </>
        )}

        <label className="checkbox-field highlight">
          <input
            type="checkbox"
            checked={exclusivoDiabeticos}
            onChange={(e) => {
              setExclusivoDiabeticos(e.target.checked);
              if (e.target.checked) setContieneAzucar(false);
            }}
          />
          <span>🩺 Exclusivo para diabéticos (solo reparte entre familias con diabetes)</span>
        </label>

        <label className="checkbox-field highlight">
          <input
            type="checkbox"
            checked={contieneAzucar}
            disabled={exclusivoDiabeticos}
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
