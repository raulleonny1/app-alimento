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
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Beneficiario, Familiar } from '../types';

const COL = 'beneficiarios';

function calcularRestriccion(familiares: Familiar[]): boolean {
  return familiares.some((f) => f.tieneDiabetes || f.sensibleAzucar);
}

export function useBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setBeneficiarios(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Beneficiario)
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const agregar = async (nombre: string, familiares: Familiar[]) => {
    await addDoc(collection(db, COL), {
      nombre,
      familiares,
      tieneRestriccionAzucar: calcularRestriccion(familiares),
      createdAt: Date.now(),
    });
  };

  const actualizar = async (id: string, nombre: string, familiares: Familiar[]) => {
    await updateDoc(doc(db, COL, id), {
      nombre,
      familiares,
      tieneRestriccionAzucar: calcularRestriccion(familiares),
    });
  };

  const eliminar = async (id: string) => {
    await deleteDoc(doc(db, COL, id));
  };

  return { beneficiarios, loading, agregar, actualizar, eliminar };
}
