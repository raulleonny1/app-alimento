import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Beneficiario, BeneficiarioInput } from '../types';
import { calcularRestriccionAzucar, normalizarBeneficiario } from '../lib/beneficiario';
import { datosDesactualizados, deduplicarTitulares, TOTAL_TITULARES_HOJA } from '../lib/titulares';

const COL = 'beneficiarios';

function aFirestore(data: BeneficiarioInput) {
  return {
    ...data,
    numMiembrosFamilia: Math.max(0, Math.floor(Number(data.numMiembrosFamilia) || 0)),
    tieneRestriccionAzucar: calcularRestriccionAzucar(data),
  };
}

async function cargarDesdePublic(): Promise<BeneficiarioInput[]> {
  const res = await fetch('/beneficiarios.json');
  if (!res.ok) throw new Error('No se pudo leer public/beneficiarios.json');
  const lista = await res.json();
  return lista.map((b: BeneficiarioInput) => ({
    ...b,
    numMiembrosFamilia: Math.max(0, Math.floor(Number(b.numMiembrosFamilia) || 0)),
  }));
}

/** Sincroniza Firestore con public/beneficiarios.json — conserva datos de salud editados */
async function sincronizarDesdePublic(): Promise<void> {
  const lista = await cargarDesdePublic();
  const snap = await getDocs(collection(db, COL));
  const batch = writeBatch(db);
  const expedientesValidos = new Set(lista.map((b) => b.expediente));
  const existentes = new Map(snap.docs.map((d) => [d.id, d.data() as Record<string, unknown>]));

  snap.docs.forEach((d) => {
    const exp = String(d.data().expediente ?? '').trim();
    if (!exp || !expedientesValidos.has(exp) || d.id !== exp) {
      batch.delete(d.ref);
    }
  });

  const ahora = Date.now();
  lista.forEach((b, i) => {
    const prev = existentes.get(b.expediente);
    const fusionado: BeneficiarioInput = {
      ...b,
      tieneDiabetesEnFamilia: Boolean(prev?.tieneDiabetesEnFamilia ?? b.tieneDiabetesEnFamilia),
      sensibleAzucarEnFamilia: Boolean(prev?.sensibleAzucarEnFamilia ?? b.sensibleAzucarEnFamilia),
      otraEnfermedad: Boolean(prev?.otraEnfermedad ?? b.otraEnfermedad),
      descripcionEnfermedad: String(prev?.descripcionEnfermedad ?? b.descripcionEnfermedad ?? ''),
    };
    batch.set(doc(db, COL, b.expediente), {
      ...aFirestore(fusionado),
      createdAt: Number(prev?.createdAt ?? ahora + i),
      updatedAt: ahora,
    });
  });

  await batch.commit();
}

export function useBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sincronizandoRef = useRef(false);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        setError(null);
        const lista = snap.docs.map((d) =>
          normalizarBeneficiario(d.id, d.data() as Record<string, unknown>)
        );
        const titulares = deduplicarTitulares(lista);

        if (!sincronizandoRef.current) {
          try {
            const publica = await cargarDesdePublic();
            const expedientesOficiales = new Set(publica.map((b) => b.expediente));
            const soloOficiales = titulares.filter((b) => expedientesOficiales.has(b.expediente));

            if (
              datosDesactualizados(soloOficiales, publica, snap.docs.length) ||
              soloOficiales.length !== publica.length
            ) {
              sincronizandoRef.current = true;
              await sincronizarDesdePublic();
              sincronizandoRef.current = false;
              return;
            }

            setBeneficiarios(soloOficiales);
            setLoading(false);
            return;
          } catch (e) {
            console.error(e);
          }
        }

        setBeneficiarios(titulares.slice(0, TOTAL_TITULARES_HOJA));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Error de Firebase. Configura Firestore y las variables VITE_FIREBASE_* en Vercel.');
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const agregar = async (_data: BeneficiarioInput) => {
    throw new Error(
      `Solo hay ${TOTAL_TITULARES_HOJA} titulares en la hoja oficial. No se pueden agregar más.`
    );
  };

  const actualizar = async (id: string, data: BeneficiarioInput) => {
    const nuevoId = data.expediente.trim();
    const payload = { ...aFirestore(data), updatedAt: Date.now() };
    if (nuevoId !== id) {
      await deleteDoc(doc(db, COL, id));
      await setDoc(doc(db, COL, nuevoId), { ...payload, createdAt: Date.now() });
    } else {
      await updateDoc(doc(db, COL, id), payload);
    }
  };

  const eliminar = async (id: string) => {
    const publica = await cargarDesdePublic();
    if (publica.some((b) => b.expediente === id)) {
      throw new Error('No se puede eliminar un titular de la hoja oficial. Solo puedes editar sus datos.');
    }
    await deleteDoc(doc(db, COL, id));
  };

  return { beneficiarios, loading, error, agregar, actualizar, eliminar };
}
