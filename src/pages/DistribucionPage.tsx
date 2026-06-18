import { useState } from 'react';
import { useAlimentos } from '../hooks/useAlimentos';
import { useBeneficiarios } from '../hooks/useBeneficiarios';
import { useDistribuciones } from '../hooks/useDistribuciones';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { FormularioAlimento } from '../components/FormularioAlimento';
import { calcularDistribucion } from '../lib/distribucion';
import { totalMiembrosFamilia } from '../lib/titulares';
import type { Alimento, Bolsa, ProductoEntrada } from '../types';

interface ProductoCantidad {
  alimentoId: string;
  cantidad: number;
}

export function DistribucionPage() {
  const { alimentos, loading: loadingAlimentos, buscarPorCodigo, agregar } = useAlimentos();
  const { beneficiarios, loading: loadingBenef } = useBeneficiarios();
  const { guardar } = useDistribuciones();

  const [productos, setProductos] = useState<ProductoCantidad[]>([]);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [resultado, setResultado] = useState<{
    bolsas: Bolsa[];
    advertencias: string[];
    sobrantes: { nombre: string; cantidad: number; unidad: string }[];
  } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [registrarCodigo, setRegistrarCodigo] = useState<string | null>(null);
  const [detalleTitulares, setDetalleTitulares] = useState(false);

  const loading = loadingAlimentos || loadingBenef;
  const totalMiembros = totalMiembrosFamilia(beneficiarios);

  const agregarProducto = (alimentoId: string) => {
    const existe = productos.find((p) => p.alimentoId === alimentoId);
    if (existe) {
      setProductos(
        productos.map((p) =>
          p.alimentoId === alimentoId ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    } else {
      setProductos([...productos, { alimentoId, cantidad: 1 }]);
    }
  };

  const handleScan = async (code: string) => {
    setMostrarScanner(false);
    const alimento = await buscarPorCodigo(code);
    if (!alimento) {
      setRegistrarCodigo(code);
      return;
    }
    agregarProducto(alimento.id);
  };

  const handleRegistrarNuevo = async (data: Omit<Alimento, 'id' | 'createdAt'>) => {
    await agregar(data);
    const nuevo = await buscarPorCodigo(data.codigoBarras);
    setRegistrarCodigo(null);
    if (nuevo) {
      agregarProducto(nuevo.id);
    }
  };

  const actualizarCantidad = (alimentoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setProductos(productos.filter((p) => p.alimentoId !== alimentoId));
    } else {
      setProductos(
        productos.map((p) => (p.alimentoId === alimentoId ? { ...p, cantidad } : p))
      );
    }
  };

  const calcular = () => {
    if (beneficiarios.length === 0) {
      alert('Registra beneficiados primero.');
      return;
    }
    if (productos.length === 0) {
      alert('Agrega al menos un producto con cantidad.');
      return;
    }

    const entradas: ProductoEntrada[] = productos
      .map((p) => {
        const alimento = alimentos.find((a) => a.id === p.alimentoId);
        if (!alimento) return null;
        return { alimento, cantidadTotal: p.cantidad };
      })
      .filter((x): x is ProductoEntrada => x !== null);

    const res = calcularDistribucion(entradas, beneficiarios);
    setResultado(res);
  };

  const guardarDistribucion = async () => {
    if (!resultado) return;
    setGuardando(true);
    await guardar({
      fecha: Date.now(),
      totalBeneficiarios: beneficiarios.length,
      bolsas: resultado.bolsas,
      notas: resultado.advertencias.join('; '),
    });
    setGuardando(false);
    alert('Distribución guardada en el historial.');
  };

  const reiniciar = () => {
    setProductos([]);
    setResultado(null);
  };

  if (loading) return <p className="loading">Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Crear bolsas</h2>
      </div>

      <div className="stats-row">
        <button
          type="button"
          className={`stat-card stat-card-btn${detalleTitulares ? ' active' : ''}`}
          onClick={() => setDetalleTitulares(!detalleTitulares)}
        >
          <span className="stat-num">{beneficiarios.length}</span>
          <span className="stat-label">Titulares</span>
          <span className="stat-hint">Toca para ver familias</span>
        </button>
        <div className="stat-card">
          <span className="stat-num">{totalMiembros}</span>
          <span className="stat-label">Miembros familia</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">
            {beneficiarios.filter((b) => b.tieneRestriccionAzucar).length}
          </span>
          <span className="stat-label">Con diabetes</span>
        </div>
      </div>

      {detalleTitulares && (
        <div className="card detalle-titulares">
          <p className="detalle-titulares-total">
            <strong>{beneficiarios.length}</strong> titulares (familias de hogar) ·{' '}
            <strong>{totalMiembros}</strong> miembros en total
          </p>
          <ul className="titulares-lista">
            {beneficiarios.map((b) => (
              <li key={b.id}>
                <span className="titular-nombre">
                  <span className="titular-exp">{b.expediente}</span> {b.nombre}
                </span>
                <span className="titular-miembros">
                  {b.numMiembrosFamilia} en familia
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!resultado && (
        <>
          <div className="action-buttons">
            <button className="btn primary large" onClick={() => setMostrarScanner(true)}>
              📷 Escanear código de barras
            </button>
          </div>

          {registrarCodigo && (
            <FormularioAlimento
              codigoInicial={registrarCodigo}
              titulo="Producto no registrado — agrégalo aquí"
              onGuardar={handleRegistrarNuevo}
              onCancelar={() => setRegistrarCodigo(null)}
            />
          )}

          {mostrarScanner && (
            <BarcodeScanner onScan={handleScan} onClose={() => setMostrarScanner(false)} />
          )}

          <div className="section-title">
            <span>Productos a distribuir</span>
          </div>

          {productos.length === 0 ? (
            <p className="empty">Escanea productos o selecciónalos abajo</p>
          ) : (
            <div className="list">
              {productos.map((p) => {
                const alimento = alimentos.find((a) => a.id === p.alimentoId);
                if (!alimento) return null;
                return (
                  <div key={p.alimentoId} className="card list-item producto-cantidad">
                    <div className="list-item-header">
                      <strong>{alimento.nombre}</strong>
                      {alimento.contieneAzucar && <span className="badge warning">Azúcar</span>}
                    </div>
                    <p className="barcode-display">📊 {alimento.codigoBarras}</p>
                    <div className="cantidad-control">
                      <button
                        type="button"
                        className="btn-qty"
                        onClick={() => actualizarCantidad(p.alimentoId, p.cantidad - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={p.cantidad}
                        onChange={(e) =>
                          actualizarCantidad(p.alimentoId, parseInt(e.target.value) || 0)
                        }
                        className="qty-input"
                      />
                      <span className="unidad">{alimento.unidad}</span>
                      <button
                        type="button"
                        className="btn-qty"
                        onClick={() => actualizarCantidad(p.alimentoId, p.cantidad + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {alimentos.length > 0 && productos.length < alimentos.length && (
            <>
              <div className="section-title">
                <span>Agregar de catálogo</span>
              </div>
              <div className="chip-list">
                {alimentos
                  .filter((a) => !productos.find((p) => p.alimentoId === a.id))
                  .map((a) => (
                    <button
                      key={a.id}
                      className="chip"
                      onClick={() => agregarProducto(a.id)}
                    >
                      + {a.nombre}
                    </button>
                  ))}
              </div>
            </>
          )}

          {productos.length > 0 && (
            <button className="btn primary large full" onClick={calcular}>
              🧮 Calcular distribución
            </button>
          )}
        </>
      )}

      {resultado && (
        <div className="resultado">
          <div className="resultado-header">
            <h3>✅ Bolsas listas ({resultado.bolsas.length})</h3>
            <button className="btn-text" onClick={reiniciar}>
              Nueva distribución
            </button>
          </div>

          {resultado.advertencias.length > 0 && (
            <div className="alertas">
              {resultado.advertencias.map((a, i) => (
                <p key={i} className="alerta">⚠️ {a}</p>
              ))}
            </div>
          )}

          {resultado.sobrantes.length > 0 && (
            <div className="card sobrantes">
              <strong>Sobrantes:</strong>
              <ul>
                {resultado.sobrantes.map((s, i) => (
                  <li key={i}>
                    {s.nombre}: {s.cantidad} {s.unidad}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="list">
            {resultado.bolsas.map((bolsa) => (
              <div key={bolsa.beneficiarioId} className="card bolsa-card">
                <h4>🎒 {bolsa.beneficiarioNombre}</h4>
                <ul className="bolsa-items">
                  {bolsa.items.map((item, i) => (
                    <li key={i}>
                      <span>{item.nombre}</span>
                      <span className="cantidad-badge">
                        {item.cantidad} {item.unidad}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <button
            className="btn primary large full"
            onClick={guardarDistribucion}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : '💾 Guardar en historial'}
          </button>
        </div>
      )}
    </div>
  );
}
