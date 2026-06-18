import { useState } from 'react';
import { useAlimentos } from '../hooks/useAlimentos';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { FormularioAlimento } from '../components/FormularioAlimento';
import { etiquetaCodigos, resumenStock } from '../lib/alimento';
import type { Alimento } from '../types';

export function AlimentosPage() {
  const { alimentos, loading, buscarPorCodigo, agregar, actualizar, eliminar } = useAlimentos();
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [codigoEscaneado, setCodigoEscaneado] = useState<string | null>(null);
  const [editando, setEditando] = useState<Alimento | null>(null);
  const [buscando, setBuscando] = useState(false);

  const abrirRegistro = (codigo?: string, alimento?: Alimento | null) => {
    setCodigoEscaneado(codigo ?? null);
    setEditando(alimento ?? null);
    setMostrarForm(true);
  };

  const handleScan = async (code: string) => {
    setMostrarScanner(false);
    setBuscando(true);
    const existente = await buscarPorCodigo(code);
    setBuscando(false);

    if (existente) {
      abrirRegistro(undefined, existente);
    } else {
      abrirRegistro(code, null);
    }
  };

  const handleGuardar = async (
    data: Omit<Alimento, 'id' | 'createdAt'>,
    _extras?: { cantidadIngresada: number }
  ) => {
    if (editando) {
      await actualizar(editando.id, data);
    } else {
      await agregar(data);
    }
    setMostrarForm(false);
    setCodigoEscaneado(null);
    setEditando(null);
  };

  if (loading || buscando) return <p className="loading">Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Alimentos</h2>
      </div>

      <p className="info-banner">
        Escanea el código de barras del producto para registrarlo. Si ya existe, podrás editarlo.
      </p>

      <div className="action-buttons">
        <button className="btn primary large" onClick={() => setMostrarScanner(true)}>
          📷 Escanear código de barras
        </button>
        <button
          className="btn secondary large"
          onClick={() => abrirRegistro()}
        >
          ✏️ Agregar con código manual
        </button>
      </div>

      {mostrarScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setMostrarScanner(false)}
        />
      )}

      {mostrarForm && (
        <FormularioAlimento
          codigoInicial={codigoEscaneado ?? undefined}
          alimentoExistente={editando}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarForm(false);
            setCodigoEscaneado(null);
            setEditando(null);
          }}
        />
      )}

      <div className="section-title">
        <span>Catálogo ({alimentos.length})</span>
      </div>

      <div className="list">
        {alimentos.length === 0 ? (
          <p className="empty">No hay productos. Escanea un código de barras para agregar el primero.</p>
        ) : (
          alimentos.map((a) => (
            <div key={a.id} className="card list-item">
              <div className="list-item-header">
                <strong>{a.nombre}</strong>
                {a.contieneAzucar && <span className="badge warning">Azúcar</span>}
              </div>
              <p className="barcode-display">📊 {etiquetaCodigos(a)}</p>
              <p className="meta">Unidad: {a.unidad}</p>
              {a.stock != null && a.stock > 0 && (
                <p className="meta">{resumenStock(a)}</p>
              )}
              <div className="list-actions">
                <button className="btn-text" onClick={() => abrirRegistro(undefined, a)}>
                  Editar
                </button>
                <button
                  className="btn-text danger"
                  onClick={() => {
                    if (confirm(`¿Eliminar ${a.nombre}?`)) eliminar(a.id);
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
