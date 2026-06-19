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
  deleteField,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Alimento } from '../types';
import type { ConsumoStock } from '../lib/inventario';
import { normalizarAlimento } from '../lib/alimento';

const COL = 'alimentos';

function mapDoc(d: { id: string; data: () => Record<string, unknown> }): Alimento {
  const raw = d.data();
  return {
    id: d.id,
    ...raw,
    ...normalizarAlimento(raw),
  } as Alimento;
}

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
        setAlimentos(snap.docs.map((d) => mapDoc({ id: d.id, data: () => d.data() })));
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
    const c = codigo.trim();
    if (!c) return null;

    const enMemoria = alimentos.find((a) => a.codigoBarras === c || a.codigoBarras2 === c);
    if (enMemoria) return enMemoria;

    let snap = await getDocs(query(collection(db, COL), where('codigoBarras', '==', c)));
    if (!snap.empty) return mapDoc({ id: snap.docs[0].id, data: () => snap.docs[0].data() });

    snap = await getDocs(query(collection(db, COL), where('codigoBarras2', '==', c)));
    if (!snap.empty) return mapDoc({ id: snap.docs[0].id, data: () => snap.docs[0].data() });

    return null;
  };

  const verificarCodigosUnicos = async (
    codigoBarras: string,
    codigoBarras2?: string,
    excluirId?: string
  ): Promise<{ alimento: Alimento; codigo: string } | null> => {
    const codigos = [codigoBarras.trim(), codigoBarras2?.trim()].filter((c): c is string =>
      Boolean(c)
    );

    for (const c of codigos) {
      const existente = await buscarPorCodigo(c);
      if (existente && existente.id !== excluirId) {
        return { alimento: existente, codigo: c };
      }
    }
    return null;
  };

  const agregar = async (data: Omit<Alimento, 'id' | 'createdAt'>) => {
    const payload: Record<string, unknown> = { ...data, createdAt: Date.now(), updatedAt: Date.now() };
    if (!data.esCaja) {
      delete payload.esCaja;
      delete payload.unidadesPorCaja;
    }
    if (!data.codigoBarras2?.trim()) {
      delete payload.codigoBarras2;
    }
    if (data.stock == null || data.stock < 1) {
      delete payload.stock;
    }
    if (!data.exclusivoDiabeticos) {
      delete payload.exclusivoDiabeticos;
    }
    await addDoc(collection(db, COL), payload);
  };

  const actualizar = async (id: string, data: Partial<Omit<Alimento, 'id'>>) => {
    const payload: Record<string, unknown> = { ...data, updatedAt: Date.now() };
    if (!data.esCaja) {
      payload.esCaja = false;
      payload.unidadesPorCaja = deleteField();
    }
    if (!data.codigoBarras2?.trim()) {
      payload.codigoBarras2 = deleteField();
    }
    if (!data.exclusivoDiabeticos) {
      payload.exclusivoDiabeticos = false;
    }
    if (data.stock == null || data.stock < 0) {
      payload.stock = deleteField();
    }
    await updateDoc(doc(db, COL, id), payload);
  };

  const descontarStock = async (consumos: ConsumoStock[]) => {
    for (const { alimentoId, unidades } of consumos) {
      const a = alimentos.find((x) => x.id === alimentoId);
      if (!a || a.stock == null || unidades <= 0) continue;
      await updateDoc(doc(db, COL, alimentoId), {
        stock: Math.max(0, a.stock - unidades),
        updatedAt: Date.now(),
      });
    }
  };

  const eliminar = async (id: string) => {
    await deleteDoc(doc(db, COL, id));
  };

  return {
    alimentos,
    loading,
    error,
    buscarPorCodigo,
    verificarCodigosUnicos,
    agregar,
    actualizar,
    descontarStock,
    eliminar,
  };
}
