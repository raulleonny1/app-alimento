import { useState } from 'react';
import { useBeneficiarios } from '../hooks/useBeneficiarios';
import type { Beneficiario, Familiar } from '../types';

const familiarVacio = (): Familiar => ({
  nombre: '',
  tieneDiabetes: false,
  sensibleAzucar: false,
});

function FormularioBeneficiario({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: Beneficiario;
  onGuardar: (nombre: string, familiares: Familiar[]) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [familiares, setFamiliares] = useState<Familiar[]>(
    inicial?.familiares?.length ? inicial.familiares : [familiarVacio()]
  );
  const [guardando, setGuardando] = useState(false);

  const agregarFamiliar = () => setFamiliares([...familiares, familiarVacio()]);

  const actualizarFamiliar = (index: number, campo: keyof Familiar, valor: string | boolean) => {
    const copia = [...familiares];
    copia[index] = { ...copia[index], [campo]: valor };
    setFamiliares(copia);
  };

  const eliminarFamiliar = (index: number) => {
    if (familiares.length <= 1) return;
    setFamiliares(familiares.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    const fams = familiares.filter((f) => f.nombre.trim());
    setGuardando(true);
    await onGuardar(nombre.trim(), fams);
    setGuardando(false);
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h3>{inicial ? 'Editar beneficiado' : 'Nuevo beneficiado'}</h3>

      <label className="field">
        <span>Nombre del beneficiado</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: María García"
          required
        />
      </label>

      <div className="section-title">
        <span>Familiares</span>
        <button type="button" className="btn-text" onClick={agregarFamiliar}>
          + Agregar
        </button>
      </div>

      {familiares.map((f, i) => (
        <div key={i} className="familiar-card">
          <label className="field">
            <span>Nombre del familiar</span>
            <input
              type="text"
              value={f.nombre}
              onChange={(e) => actualizarFamiliar(i, 'nombre', e.target.value)}
              placeholder="Ej: Juan (hijo)"
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={f.tieneDiabetes}
              onChange={(e) => actualizarFamiliar(i, 'tieneDiabetes', e.target.checked)}
            />
            <span>Tiene diabetes</span>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={f.sensibleAzucar}
              onChange={(e) => actualizarFamiliar(i, 'sensibleAzucar', e.target.checked)}
            />
            <span>Sensible al azúcar / no debe consumir azúcar</span>
          </label>
          {familiares.length > 1 && (
            <button type="button" className="btn-text danger" onClick={() => eliminarFamiliar(i)}>
              Eliminar familiar
            </button>
          )}
        </div>
      ))}

      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn primary" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

export function BeneficiariosPage() {
  const { beneficiarios, loading, agregar, actualizar, eliminar } = useBeneficiarios();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Beneficiario | null>(null);

  const handleGuardar = async (nombre: string, familiares: Familiar[]) => {
    if (editando) {
      await actualizar(editando.id, nombre, familiares);
      setEditando(null);
    } else {
      await agregar(nombre, familiares);
    }
    setMostrarForm(false);
  };

  if (loading) return <p className="loading">Cargando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Beneficiados</h2>
        {!mostrarForm && !editando && (
          <button className="btn primary" onClick={() => setMostrarForm(true)}>
            + Nuevo
          </button>
        )}
      </div>

      <p className="info-banner">
        Registra si algún familiar tiene diabetes o no puede consumir azúcar. Esos beneficiados no
        recibirán alimentos con azúcar en la distribución.
      </p>

      {(mostrarForm || editando) && (
        <FormularioBeneficiario
          inicial={editando ?? undefined}
          onGuardar={handleGuardar}
          onCancelar={() => {
            setMostrarForm(false);
            setEditando(null);
          }}
        />
      )}

      <div className="list">
        {beneficiarios.length === 0 ? (
          <p className="empty">No hay beneficiados registrados</p>
        ) : (
          beneficiarios.map((b) => (
            <div key={b.id} className="card list-item">
              <div className="list-item-header">
                <strong>{b.nombre}</strong>
                {b.tieneRestriccionAzucar && (
                  <span className="badge warning">Sin azúcar</span>
                )}
              </div>
              {b.familiares.length > 0 && (
                <ul className="familiares-list">
                  {b.familiares.map((f, i) => (
                    <li key={i}>
                      {f.nombre}
                      {f.tieneDiabetes && ' — Diabetes'}
                      {f.sensibleAzucar && ' — Sensible al azúcar'}
                    </li>
                  ))}
                </ul>
              )}
              <div className="list-actions">
                <button className="btn-text" onClick={() => setEditando(b)}>
                  Editar
                </button>
                <button
                  className="btn-text danger"
                  onClick={() => {
                    if (confirm(`¿Eliminar a ${b.nombre}?`)) eliminar(b.id);
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
