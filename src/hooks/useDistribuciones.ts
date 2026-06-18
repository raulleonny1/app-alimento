import { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { SesionDistribucion } from '../types';

const COL = 'distribuciones';

export function useDistribuciones() {
  const [distribuciones, setDistribuciones] = useState<SesionDistribucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('fecha', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setError(null);
        setDistribuciones(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              totalTitulares: data.totalTitulares ?? data.totalBeneficiarios ?? 0,
              totalBeneficiarios: data.totalBeneficiarios ?? data.totalTitulares ?? 0,
              productosUsados: data.productosUsados ?? [],
              advertencias: data.advertencias ?? [],
              sobrantes: data.sobrantes ?? [],
            } as SesionDistribucion;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('No se pudo leer el historial de Firebase');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const guardar = async (sesion: Omit<SesionDistribucion, 'id'>) => {
    await addDoc(collection(db, COL), {
      ...sesion,
      guardadoEn: Date.now(),
    });
  };

  return { distribuciones, loading, error, guardar };
}
