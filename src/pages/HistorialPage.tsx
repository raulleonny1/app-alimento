import { useMemo, useState } from 'react';
import { useDistribuciones } from '../hooks/useDistribuciones';
import { useAlimentos } from '../hooks/useAlimentos';
import { useBeneficiarios } from '../hooks/useBeneficiarios';
import { formatFechaReparto } from '../lib/fecha';
import {
  etiquetaStock,
  registroEntregasPorTitular,
  resumenInventario,
  stockDisponible,
  textoProductoUsado,
} from '../lib/inventario';

type Tab = 'entregas' | 'inventario' | 'titulares';

export function HistorialPage() {
  const { distribuciones, loading: loadingDist, error: errorDist } = useDistribuciones();
  const { alimentos, loading: loadingAli, error: errorAli } = useAlimentos();
  const { beneficiarios, loading: loadingBenef, error: errorBenef } = useBeneficiarios();

  const [tab, setTab] = useState<Tab>('entregas');
  const [expandidoEntrega, setExpandidoEntrega] = useState<string | null>(null);
  const [expandidoTitular, setExpandidoTitular] = useState<string | null>(null);

  const inventario = useMemo(() => resumenInventario(alimentos), [alimentos]);
  const porTitular = useMemo(
    () => registroEntregasPorTitular(distribuciones, beneficiarios),
    [distribuciones, beneficiarios]
  );

  const loading = loadingDist || loadingAli || loadingBenef;
  const error = errorDist || errorAli || errorBenef;

  if (loading) return <p className="loading">Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Entregas e inventario</h2>
      </div>

      {error && <p className="alerta">{error}</p>}

      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn${tab === 'entregas' ? ' active' : ''}`}
          onClick={() => setTab('entregas')}
        >
          📅 Entregas
        </button>
        <button
          type="button"
          className={`tab-btn${tab === 'inventario' ? ' active' : ''}`}
          onClick={() => setTab('inventario')}
        >
          📦 Inventario
        </button>
        <button
          type="button"
          className={`tab-btn${tab === 'titulares' ? ' active' : ''}`}
          onClick={() => setTab('titulares')}
        >
          👤 Por titular
        </button>
      </div>

      {tab === 'entregas' && (
        <>
          <p className="info-banner">
            Historial de repartos guardados con fecha. Toca una entrega para ver qué salió y qué
            recibió cada familia.
          </p>

          {distribuciones.length === 0 ? (
            <p className="empty">No hay entregas registradas aún</p>
          ) : (
            <div className="list">
              {distribuciones.map((d) => (
                <div key={d.id} className="card list-item">
                  <button
                    type="button"
                    className="historial-header"
                    onClick={() =>
                      setExpandidoEntrega(expandidoEntrega === d.id ? null : d.id)
                    }
                  >
                    <div>
                      <span className="badge info fecha-badge">
                        {formatFechaReparto(d.fecha)}
                      </span>
                      <p className="meta">
                        {d.bolsas.length} bolsas · {d.totalTitulares ?? d.totalBeneficiarios}{' '}
                        titulares
                        {d.totalMiembrosFamilia
                          ? ` · ${d.totalMiembrosFamilia} personas UF`
                          : ''}
                      </p>
                    </div>
                    <span>{expandidoEntrega === d.id ? '▲' : '▼'}</span>
                  </button>

                  {expandidoEntrega === d.id && (
                    <div className="historial-detalle">
                      {d.productosUsados?.length > 0 && (
                        <div className="historial-seccion">
                          <strong>Productos entregados en esta fecha</strong>
                          <ul>
                            {d.productosUsados.map((p, i) => (
                              <li key={i}>
                                {p.nombre}: {textoProductoUsado(p)}
                                {p.exclusivoDiabeticos ? ' (solo diabéticos)' : ''}
                                {p.contieneAzucar ? ' (azúcar)' : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {d.sobrantes?.length > 0 && (
                        <div className="historial-seccion">
                          <strong>Sobrante (vuelve al inventario manual)</strong>
                          <ul>
                            {d.sobrantes.map((s, i) => (
                              <li key={i}>
                                {s.nombre}: {s.cantidad} {s.unidad}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="historial-seccion">
                        <strong>Qué recibió cada titular</strong>
                        {d.bolsas.map((bolsa) => (
                          <div key={bolsa.beneficiarioId} className="bolsa-resumen">
                            <strong>
                              {bolsa.expediente ? `${bolsa.expediente} · ` : ''}
                              {bolsa.beneficiarioNombre}
                            </strong>
                            <ul>
                              {bolsa.items.map((item, i) => (
                                <li key={i}>
                                  {item.nombre}: {item.cantidad} {item.unidad}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'inventario' && (
        <>
          <div className="stats-row stats-row-2">
            <div className="stat-card">
              <span className="stat-num">{inventario.conStock}</span>
              <span className="stat-label">Con existencia</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{inventario.agotados}</span>
              <span className="stat-label">Agotados</span>
            </div>
          </div>

          <p className="info-banner">
            Stock actual de cada producto. Al guardar una entrega se descuenta lo repartido (el
            sobrante no se descuenta).
          </p>

          {alimentos.length === 0 ? (
            <p className="empty">No hay productos en el catálogo</p>
          ) : (
            <div className="list">
              {alimentos.map((a) => {
                const stock = stockDisponible(a);
                const agotado = stock === 0;
                const sinRegistro = stock == null;
                return (
                  <div key={a.id} className="card list-item">
                    <div className="list-item-header">
                      <strong>{a.nombre}</strong>
                      {agotado && <span className="badge warning">Agotado</span>}
                      {sinRegistro && <span className="badge warning">Sin stock</span>}
                      {!agotado && !sinRegistro && <span className="badge ok">Disponible</span>}
                    </div>
                    <p className="meta inventario-stock">
                      {sinRegistro
                        ? 'Edita el producto en Alimentos para registrar cuántas unidades hay.'
                        : `Quedan: ${etiquetaStock(a)}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'titulares' && (
        <>
          <p className="info-banner">
            Registro acumulado de lo que ha recibido cada titular en todas las entregas.
          </p>

          {porTitular.every((t) => t.entregas.length === 0) ? (
            <p className="empty">Aún no hay entregas registradas por titular</p>
          ) : (
            <div className="list">
              {porTitular.map((t) => (
                <div key={t.id} className="card list-item">
                  <button
                    type="button"
                    className="historial-header"
                    onClick={() =>
                      setExpandidoTitular(expandidoTitular === t.id ? null : t.id)
                    }
                  >
                    <div>
                      <strong>
                        {t.expediente} · {t.nombre}
                      </strong>
                      <p className="meta">
                        {t.entregas.length === 0
                          ? 'Sin entregas registradas'
                          : `${t.entregas.length} entrega(s) registrada(s)`}
                      </p>
                    </div>
                    <span>{expandidoTitular === t.id ? '▲' : '▼'}</span>
                  </button>

                  {expandidoTitular === t.id && t.entregas.length > 0 && (
                    <div className="historial-detalle">
                      {[...t.entregas].reverse().map((entrega, i) => (
                        <div key={i} className="bolsa-resumen">
                          <strong>{formatFechaReparto(entrega.fecha)}</strong>
                          <ul>
                            {entrega.items.map((item, j) => (
                              <li key={j}>
                                {item.nombre}: {item.cantidad} {item.unidad}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
