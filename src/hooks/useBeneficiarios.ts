import { useEffect, useRef, useState } from 'react';
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
import { calcularRestriccionAzucar, normalizarBeneficiario } from '../lib/beneficiario';

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

async function importarLista(lista: BeneficiarioInput[]) {
  const batch = writeBatch(db);
  const ahora = Date.now();
  lista.forEach((b, i) => {
    const ref = doc(collection(db, COL));
    batch.set(ref, { ...aFirestore(b), createdAt: ahora + i });
  });
  await batch.commit();
}

function aBeneficiarioLocal(data: BeneficiarioInput, index: number): Beneficiario {
  return {
    ...data,
    id: `local-${data.expediente}-${index}`,
    tieneRestriccionAzucar: calcularRestriccionAzucar(data),
    createdAt: index,
  };
}

export function useBeneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const importandoRef = useRef(false);

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        setError(null);

        if (snap.empty && !importandoRef.current) {
          importandoRef.current = true;
          try {
            const lista = await cargarDesdePublic();
            await importarLista(lista);
            return;
          } catch (e) {
            console.error(e);
            try {
              const lista = await cargarDesdePublic();
              setBeneficiarios(lista.map(aBeneficiarioLocal));
              setError('Sin conexión a Firestore. Mostrando datos de public/beneficiarios.json');
            } catch {
              setError('No se pudieron cargar los beneficiados');
            }
          } finally {
            importandoRef.current = false;
            setLoading(false);
          }
          return;
        }

        setBeneficiarios(
          snap.docs.map((d) => normalizarBeneficiario(d.id, d.data() as Record<string, unknown>))
        );
        setLoading(false);
      },
      async (err) => {
        console.error(err);
        try {
          const lista = await cargarDesdePublic();
          setBeneficiarios(lista.map(aBeneficiarioLocal));
          setError('Firestore no disponible. Mostrando datos de public/beneficiarios.json');
        } catch {
          setError('Error de Firebase. Revisa las variables de entorno en Vercel.');
        }
        setLoading(false);
      }
    );

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

  const recargarDesdePublic = async () => {
    const lista = await cargarDesdePublic();
    await importarLista(lista);
  };

  return { beneficiarios, loading, error, agregar, actualizar, eliminar, recargarDesdePublic };
}
