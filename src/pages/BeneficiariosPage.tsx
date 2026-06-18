import { useState } from 'react';
import { useBeneficiarios } from '../hooks/useBeneficiarios';
import type { Beneficiario, BeneficiarioInput } from '../types';
import { etiquetasSalud } from '../lib/beneficiario';
import { textoPersonasHogar, TOTAL_TITULARES_HOJA } from '../lib/titulares';

const vacio = (): BeneficiarioInput => ({
  expediente: '',
  nombre: '',
  dni: '',
  telefono: '',
  numMiembrosFamilia: 0,
  tieneDiabetesEnFamilia: false,
  sensibleAzucarEnFamilia: false,
  otraEnfermedad: false,
  descripcionEnfermedad: '',
});

function desdeBeneficiario(b: Beneficiario): BeneficiarioInput {
  return {
    expediente: b.expediente,
    nombre: b.nombre,
    dni: b.dni,
    telefono: b.telefono,
    numMiembrosFamilia: b.numMiembrosFamilia,
    tieneDiabetesEnFamilia: b.tieneDiabetesEnFamilia,
    sensibleAzucarEnFamilia: b.sensibleAzucarEnFamilia,
    otraEnfermedad: b.otraEnfermedad,
    descripcionEnfermedad: b.descripcionEnfermedad,
  };
}

function FormularioBeneficiario({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: Beneficiario;
  onGuardar: (data: BeneficiarioInput) => Promise<void>;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState<BeneficiarioInput>(
    inicial ? desdeBeneficiario(inicial) : vacio()
  );
  const [guardando, setGuardando] = useState(false);

  const setCampo = <K extends keyof BeneficiarioInput>(campo: K, valor: BeneficiarioInput[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.expediente.trim()) return;
    setGuardando(true);
    await onGuardar({
      ...form,
      expediente: form.expediente.trim(),
      nombre: form.nombre.trim(),
      dni: form.dni.trim(),
      telefono: form.telefono.trim(),
      descripcionEnfermedad: form.descripcionEnfermedad.trim(),
    });
    setGuardando(false);
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h3>Editar titular</h3>

      <label className="field">
        <span>N° Expediente</span>
        <input
          type="text"
          inputMode="numeric"
          value={form.expediente}
          readOnly
          required
        />
      </label>

      <label className="field">
        <span>Nombre y apellidos del titular</span>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => setCampo('nombre', e.target.value)}
          placeholder="Ej: Pedro Del Rio Rodríguez"
          required
        />
      </label>

      <label className="field">
        <span>DNI / NIE / Pasaporte</span>
        <input
          type="text"
          value={form.dni}
          onChange={(e) => setCampo('dni', e.target.value.toUpperCase())}
          placeholder="Ej: 06518286V"
        />
      </label>

      <label className="field">
        <span>Teléfono</span>
        <input
          type="tel"
          inputMode="tel"
          value={form.telefono}
          onChange={(e) => setCampo('telefono', e.target.value)}
          placeholder="Ej: 916774090"
        />
      </label>

      <label className="field">
        <span>N° miembros unidad familiar (dato de la hoja)</span>
        <input
          type="number"
          min={0}
          value={form.numMiembrosFamilia}
          readOnly
          required
        />
      </label>

      <div className="section-title">
        <span>Salud de la familia</span>
      </div>

      <p className="salud-aviso">
        ⚠️ Indica si algún miembro de la familia tiene condiciones que afecten los alimentos que
        puede recibir.
      </p>

      <label className="checkbox-field highlight">
        <input
          type="checkbox"
          checked={form.tieneDiabetesEnFamilia}
          onChange={(e) => setCampo('tieneDiabetesEnFamilia', e.target.checked)}
        />
        <span>Algún familiar tiene diabetes</span>
      </label>

      <label className="checkbox-field highlight">
        <input
          type="checkbox"
          checked={form.sensibleAzucarEnFamilia}
          onChange={(e) => setCampo('sensibleAzucarEnFamilia', e.target.checked)}
        />
        <span>Algún familiar es sensible al azúcar / no debe consumir azúcar</span>
      </label>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={form.otraEnfermedad}
          onChange={(e) => setCampo('otraEnfermedad', e.target.checked)}
        />
        <span>Otra enfermedad en la familia</span>
      </label>

      {form.otraEnfermedad && (
        <label className="field">
          <span>¿Cuál enfermedad o restricción?</span>
          <input
            type="text"
            value={form.descripcionEnfermedad}
            onChange={(e) => setCampo('descripcionEnfermedad', e.target.value)}
            placeholder="Ej: Hipertensión, alergia, celiaquía..."
          />
        </label>
      )}

      {(form.tieneDiabetesEnFamilia || form.sensibleAzucarEnFamilia) && (
        <p className="alerta-inline">
          En productos con azúcar recibirán <strong>cantidad mínima</strong> (ej. 1 funda de azúcar o galletas).
        </p>
      )}

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
  const { beneficiarios, loading, error, actualizar } = useBeneficiarios();
  const [editando, setEditando] = useState<Beneficiario | null>(null);

  const handleGuardar = async (data: BeneficiarioInput) => {
    if (editando) {
      await actualizar(editando.id, data);
      setEditando(null);
    }
  };

  if (loading) return <p className="loading">Cargando beneficiados...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Titulares ({beneficiarios.length}/{TOTAL_TITULARES_HOJA})</h2>
      </div>

      {error && <p className="alerta">{error}</p>}

      <p className="info-banner">
        Son <strong>{TOTAL_TITULARES_HOJA} familias titulares</strong> según la hoja de firmas (1 bolsa por
        titular). Solo puedes editar teléfono y datos de salud.
      </p>

      <details className="card hoja-referencia">
        <summary>Ver hoja de referencia</summary>
        <img src="/beneficiados.jpeg" alt="Hoja de firmas - kilos entrega" className="hoja-img" />
      </details>

      {editando && (
        <FormularioBeneficiario
          inicial={editando}
          onGuardar={handleGuardar}
          onCancelar={() => setEditando(null)}
        />
      )}

      <div className="list">
        {beneficiarios.length === 0 ? (
          <p className="empty">No hay beneficiados registrados</p>
        ) : (
          beneficiarios.map((b) => {
            const salud = etiquetasSalud(b);
            return (
              <div key={b.id} className="card list-item">
                <div className="list-item-header">
                  <strong>{b.nombre}</strong>
                  {b.tieneRestriccionAzucar && (
                    <span className="badge warning">Diabetes</span>
                  )}
                </div>
                <p className="meta">Expediente: {b.expediente || '—'}</p>
                <p className="meta">DNI/NIE: {b.dni || '—'}</p>
                <p className="meta">Teléfono: {b.telefono || '—'}</p>
                <p className="meta">{textoPersonasHogar(b.numMiembrosFamilia)}</p>
                {salud.length > 0 && (
                  <div className="salud-tags">
                    {salud.map((s) => (
                      <span key={s} className="badge warning">{s}</span>
                    ))}
                  </div>
                )}
                <div className="list-actions">
                  <button className="btn-text" onClick={() => setEditando(b)}>
                    Editar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
