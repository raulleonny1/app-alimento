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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('nombre', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setError(null);
        setAlimentos(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Alimento));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('No se pudieron cargar alimentos desde Firebase');
        setLoading(false);
      }
    );
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
    await addDoc(collection(db, COL), { ...data, createdAt: Date.now(), updatedAt: Date.now() });
  };

  const actualizar = async (id: string, data: Partial<Omit<Alimento, 'id'>>) => {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: Date.now() });
  };

  const eliminar = async (id: string) => {
    await deleteDoc(doc(db, COL, id));
  };

  return { alimentos, loading, error, buscarPorCodigo, agregar, actualizar, eliminar };
}
