import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Beneficiario, BeneficiarioInput } from '../types';
import { BENEFICIARIOS_HOJA, calcularRestriccionAzucar, normalizarBeneficiario } from '../lib/beneficiario';

const COL = 'beneficiarios';

function aFirestore(data: BeneficiarioInput) {
  return {
    ...data,
    tieneRestriccionAzucar: calcularRestriccionAzucar(data),
  };
}

export function useBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setBeneficiarios(
        snap.docs.map((d) => normalizarBeneficiario(d.id, d.data() as Record<string, unknown>))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const agregar = async (data: BeneficiarioInput) => {
    await addDoc(collection(db, COL), {
      ...aFirestore(data),
      createdAt: Date.now(),
    });
  };

  const actualizar = async (id: string, data: BeneficiarioInput) => {
    await updateDoc(doc(db, COL, id), aFirestore(data));
  };

  const eliminar = async (id: string) => {
    await deleteDoc(doc(db, COL, id));
  };

  const importarHoja = async () => {
    const batch = writeBatch(db);
    const ahora = Date.now();
    BENEFICIARIOS_HOJA.forEach((b, i) => {
      const ref = doc(collection(db, COL));
      batch.set(ref, { ...aFirestore(b), createdAt: ahora + i });
    });
    await batch.commit();
  };

  return { beneficiarios, loading, agregar, actualizar, eliminar, importarHoja };
}
