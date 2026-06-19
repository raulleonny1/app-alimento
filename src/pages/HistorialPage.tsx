import { useState } from 'react';
import { useDistribuciones } from '../hooks/useDistribuciones';

import { formatFechaReparto } from '../lib/fecha';

export function HistorialPage() {
  const { distribuciones, loading, error } = useDistribuciones();
  const [expandido, setExpandido] = useState<string | null>(null);

  if (loading) return <p className="loading">Cargando historial...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Historial</h2>
      </div>

      {error && <p className="alerta">{error}</p>}

      <p className="info-banner">
        Todas las distribuciones quedan guardadas en Firebase para consultar después.
      </p>

      {distribuciones.length === 0 ? (
        <p className="empty">No hay distribuciones guardadas aún</p>
      ) : (
        <div className="list">
          {distribuciones.map((d) => (
            <div key={d.id} className="card list-item">
              <button
                className="historial-header"
                onClick={() => setExpandido(expandido === d.id ? null : d.id)}
              >
                <div>
                  <strong>{formatFechaReparto(d.fecha)}</strong>
                  <p className="meta">
                    {d.bolsas.length} bolsas · {d.totalTitulares ?? d.totalBeneficiarios} titulares
                    {d.totalMiembrosFamilia ? ` · ${d.totalMiembrosFamilia} miembros` : ''}
                  </p>
                </div>
                <span>{expandido === d.id ? '▲' : '▼'}</span>
              </button>

              {expandido === d.id && (
                <div className="historial-detalle">
                  {d.productosUsados?.length > 0 && (
                    <div className="historial-seccion">
                      <strong>Productos usados</strong>
                      <ul>
                        {d.productosUsados.map((p, i) => (
                          <li key={i}>
                            {p.nombre}:{' '}
                            {p.esCaja && p.cajasUsadas
                              ? `${p.cajasUsadas} caja(s) × ${p.unidadesPorCaja} = ${p.cantidadTotal} unidades`
                              : `${p.cantidadTotal} ${p.unidad}`}
                            {p.exclusivoDiabeticos ? ' (solo diabéticos)' : ''}
                            {p.contieneAzucar ? ' (azúcar)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {d.advertencias?.length > 0 && (
                    <div className="alertas">
                      {d.advertencias.map((a, i) => (
                        <p key={i} className="alerta">⚠️ {a}</p>
                      ))}
                    </div>
                  )}

                  {d.sobrantes?.length > 0 && (
                    <div className="historial-seccion">
                      <strong>Sobrantes</strong>
                      <ul>
                        {d.sobrantes.map((s, i) => (
                          <li key={i}>
                            {s.nombre}: {s.cantidad} {s.unidad}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {d.bolsas.map((bolsa) => (
                    <div key={bolsa.beneficiarioId} className="bolsa-resumen">
                      <strong>{bolsa.beneficiarioNombre}</strong>
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
