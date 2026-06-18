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
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Alimento } from '../types';

const COL = 'alimentos';

export function useAlimentos() {
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('nombre', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setAlimentos(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Alimento));
      setLoading(false);
    });
    return unsub;
  }, []);

  const buscarPorCodigo = async (codigo: string): Promise<Alimento | null> => {
    const q = query(collection(db, COL), where('codigoBarras', '==', codigo));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Alimento;
  };

  const agregar = async (data: Omit<Alimento, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, COL), { ...data, createdAt: Date.now() });
  };

  const actualizar = async (id: string, data: Partial<Omit<Alimento, 'id'>>) => {
    await updateDoc(doc(db, COL, id), data);
  };

  const eliminar = async (id: string) => {
    await deleteDoc(doc(db, COL, id));
  };

  return { alimentos, loading, buscarPorCodigo, agregar, actualizar, eliminar };
}
