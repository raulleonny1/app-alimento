import { useState } from 'react';
import { useDistribuciones } from '../hooks/useDistribuciones';

function formatFecha(ts: number): string {
  return new Date(ts).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistorialPage() {
  const { distribuciones, loading } = useDistribuciones();
  const [expandido, setExpandido] = useState<string | null>(null);

  if (loading) return <p className="loading">Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Historial</h2>
      </div>

      {distribuciones.length === 0 ? (
        <p className="empty">No hay distribuciones guardadas</p>
      ) : (
        <div className="list">
          {distribuciones.map((d) => (
            <div key={d.id} className="card list-item">
              <button
                className="historial-header"
                onClick={() => setExpandido(expandido === d.id ? null : d.id)}
              >
                <div>
                  <strong>{formatFecha(d.fecha)}</strong>
                  <p className="meta">
                    {d.bolsas.length} bolsas · {d.totalBeneficiarios} beneficiados
                  </p>
                </div>
                <span>{expandido === d.id ? '▲' : '▼'}</span>
              </button>

              {expandido === d.id && (
                <div className="historial-detalle">
                  {d.notas && <p className="alerta">⚠️ {d.notas}</p>}
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