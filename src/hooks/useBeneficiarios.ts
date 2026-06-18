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
import { deduplicarTitulares } from '../lib/titulares';

const COL = 'beneficiarios';

function aFirestore(data: BeneficiarioInput) {
  return {
    ...data,
    tieneRestriccionAzucar: calcularRestriccionAzucar(data),
  };
}

async function cargarDesdePublic(): Promise<BeneficiarioInput[]> {
  const res = await fetch('/beneficiarios.json');
  if (!res.ok) throw new Error('No se pudo leer public/beneficiarios.json');
  return res.json();
}

/** Sincroniza Firestore con public/beneficiarios.json — 1 doc por expediente, sin duplicados */
async function sincronizarDesdePublic(): Promise<void> {
  const lista = await cargarDesdePublic();
  const snap = await getDocs(collection(db, COL));
  const batch = writeBatch(db);
  const expedientesValidos = new Set(lista.map((b) => b.expediente));

  snap.docs.forEach((d) => {
    const exp = String(d.data().expediente ?? '');
    if (!expedientesValidos.has(exp) || d.id !== exp) {
      batch.delete(d.ref);
    }
  });

  const ahora = Date.now();
  lista.forEach((b, i) => {
    batch.set(doc(db, COL, b.expediente), { ...aFirestore(b), createdAt: ahora + i });
  });

  await batch.commit();
}

function necesitaSincronizar(docs: Beneficiario[], listaPublic: BeneficiarioInput[]): boolean {
  if (docs.length === 0) return true;
  if (docs.length !== listaPublic.length) return true;
  const expedientes = docs.map((d) => d.expediente);
  return new Set(expedientes).size !== expedientes.length;
}

function aBeneficiarioLocal(data: BeneficiarioInput, index: number): Beneficiario {
  return {
    ...data,
    id: data.expediente,
    tieneRestriccionAzucar: calcularRestriccionAzucar(data),
    createdAt: index,
  };
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
            if (necesitaSincronizar(titulares, publica)) {
              sincronizandoRef.current = true;
              await sincronizarDesdePublic();
              sincronizandoRef.current = false;
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }

        setBeneficiarios(titulares);
        setLoading(false);
      },
      async (err) => {
        console.error(err);
        try {
          const publica = await cargarDesdePublic();
          setBeneficiarios(deduplicarTitulares(publica.map(aBeneficiarioLocal)));
          setError('Sin Firebase. Datos de public/beneficiarios.json');
        } catch {
          setError('Error al cargar titulares');
        }
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const agregar = async (data: BeneficiarioInput) => {
    const id = data.expediente.trim();
    await setDoc(doc(db, COL, id), { ...aFirestore(data), createdAt: Date.now() });
  };

  const actualizar = async (id: string, data: BeneficiarioInput) => {
    const nuevoId = data.expediente.trim();
    if (nuevoId !== id) {
      await deleteDoc(doc(db, COL, id));
      await setDoc(doc(db, COL, nuevoId), { ...aFirestore(data), createdAt: Date.now() });
    } else {
      await updateDoc(doc(db, COL, id), aFirestore(data));
    }
  };

  const eliminar = async (id: string) => {
    await deleteDoc(doc(db, COL, id));
  };

  return { beneficiarios, loading, error, agregar, actualizar, eliminar };
}
