import { useState } from 'react';
import { useAlimentos } from '../hooks/useAlimentos';
import { useBeneficiarios } from '../hooks/useBeneficiarios';
import { useDistribuciones } from '../hooks/useDistribuciones';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { FormularioAlimento } from '../components/FormularioAlimento';
import { calcularDistribucion } from '../lib/distribucion';
import {
  etiquetaCantidadIngreso,
  esProductoCaja,
  etiquetaCodigos,
  resumenCantidad,
  unidadesTotales,
} from '../lib/alimento';
import { textoPersonasHogar } from '../lib/titulares';
import type { Alimento, Bolsa, ProductoEntrada } from '../types';

interface ProductoCantidad {
  alimentoId: string;
  cantidad: number;
}

export function DistribucionPage() {
  const { alimentos, loading: loadingAlimentos, buscarPorCodigo, agregar, error: errorAli } = useAlimentos();
  const { beneficiarios, loading: loadingBenef, error: errorBenef } = useBeneficiarios();
  const { guardar, error: errorDist } = useDistribuciones();

  const [productos, setProductos] = useState<ProductoCantidad[]>([]);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [resultado, setResultado] = useState<{
    bolsas: Bolsa[];
    advertencias: string[];
    sobrantes: { nombre: string; cantidad: number; unidad: string }[];
  } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardadoFirebase, setGuardadoFirebase] = useState(false);
  const [registrarCodigo, setRegistrarCodigo] = useState<string | null>(null);
  const [detalleTitulares, setDetalleTitulares] = useState(false);

  const loading = loadingAlimentos || loadingBenef;

  const agregarProducto = (alimentoId: string, cantidad = 1) => {
    const existe = productos.find((p) => p.alimentoId === alimentoId);
    if (existe) {
      setProductos(
        productos.map((p) =>
          p.alimentoId === alimentoId ? { ...p, cantidad: p.cantidad + cantidad } : p
        )
      );
    } else {
      setProductos([...productos, { alimentoId, cantidad }]);
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

  const handleRegistrarNuevo = async (
    data: Omit<Alimento, 'id' | 'createdAt'>,
    extras?: { cantidadIngresada: number }
  ) => {
    await agregar(data);
    const nuevo =
      (await buscarPorCodigo(data.codigoBarras)) ??
      (data.codigoBarras2 ? await buscarPorCodigo(data.codigoBarras2) : null);
    setRegistrarCodigo(null);
    if (nuevo) {
      agregarProducto(nuevo.id, extras?.cantidadIngresada ?? 1);
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

  const calcular = async () => {
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
        return {
          alimento,
          cantidadTotal: unidadesTotales(alimento, p.cantidad),
          cantidadIngresada: p.cantidad,
        };
      })
      .filter((x): x is ProductoEntrada => x !== null);

    const res = calcularDistribucion(entradas, beneficiarios);
    setResultado(res);
    setGuardadoFirebase(false);

    setGuardando(true);
    try {
      await guardar({
        fecha: Date.now(),
        totalTitulares: beneficiarios.length,
        totalBeneficiarios: beneficiarios.length,
        totalMiembrosFamilia: 0,
        productosUsados: entradas.map((e) => {
          const base = {
            alimentoId: e.alimento.id,
            codigoBarras: e.alimento.codigoBarras,
            nombre: e.alimento.nombre,
            cantidadTotal: e.cantidadTotal,
            unidad: esProductoCaja(e.alimento) ? 'unidad' : e.alimento.unidad,
            contieneAzucar: e.alimento.contieneAzucar,
          };
          if (esProductoCaja(e.alimento)) {
            return {
              ...base,
              esCaja: true,
              cajasUsadas: e.cantidadIngresada,
              unidadesPorCaja: e.alimento.unidadesPorCaja,
            };
          }
          return base;
        }),
        bolsas: res.bolsas,
        advertencias: res.advertencias,
        sobrantes: res.sobrantes,
        notas: res.advertencias.join('; '),
      });
      setGuardadoFirebase(true);
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar en Firebase. Revisa la conexión.');
    }
    setGuardando(false);
  };

  const reiniciar = () => {
    setProductos([]);
    setResultado(null);
    setGuardadoFirebase(false);
  };

  if (loading) return <p className="loading">Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Crear bolsas</h2>
      </div>

      {(errorBenef || errorAli || errorDist) && (
        <p className="alerta">{errorBenef || errorAli || errorDist}</p>
      )}

      <div className="stats-row stats-row-2">
        <button
          type="button"
          className={`stat-card stat-card-btn${detalleTitulares ? ' active' : ''}`}
          onClick={() => setDetalleTitulares(!detalleTitulares)}
        >
          <span className="stat-num">{beneficiarios.length}</span>
          <span className="stat-label">Titulares</span>
          <span className="stat-hint">Familias de hogar · toca para ver</span>
        </button>
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
            <strong>{beneficiarios.length}</strong> familias de hogar (1 bolsa por titular)
          </p>
          <ul className="titulares-lista">
            {beneficiarios.map((b) => (
              <li key={b.id}>
                <span className="titular-nombre">
                  <span className="titular-exp">{b.expediente}</span> {b.nombre}
                </span>
                <span className="titular-miembros">{textoPersonasHogar(b.numMiembrosFamilia)}</span>
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
                    <p className="barcode-display">📊 {etiquetaCodigos(alimento)}</p>
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
                      <span className="unidad">{etiquetaCantidadIngreso(alimento)}</span>
                      <button
                        type="button"
                        className="btn-qty"
                        onClick={() => actualizarCantidad(p.alimentoId, p.cantidad + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="meta">{resumenCantidad(alimento, p.cantidad)}</p>
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
            <button className="btn primary large full" onClick={calcular} disabled={guardando}>
              {guardando ? 'Guardando en Firebase...' : '🧮 Calcular y guardar'}
            </button>
          )}
        </>
      )}

      {resultado && (
        <div className="resultado">
          <div className="resultado-header">
            <h3>✅ Bolsas listas ({resultado.bolsas.length})</h3>
            <div className="resultado-header-actions">
              {guardadoFirebase && <span className="badge ok">Guardado en Firebase</span>}
              <button className="btn-text" onClick={reiniciar}>
                Nueva distribución
              </button>
            </div>
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
        </div>
      )}
    </div>
  );
}
