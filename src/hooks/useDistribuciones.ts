import { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { SesionDistribucion } from '../types';

const COL = 'distribuciones';

export function useDistribuciones() {
  const [distribuciones, setDistribuciones] = useState<SesionDistribucion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setDistribuciones(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SesionDistribucion)
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const guardar = async (sesion: Omit<SesionDistribucion, 'id'>) => {
    await addDoc(collection(db, COL), sesion);
  };

  return { distribuciones, loading, guardar };
}
