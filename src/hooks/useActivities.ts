import { useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreCollection } from './useFirestoreCollection';
import type { Activity } from '../types';

/**
 * Última lectura de `activities`, guardada en memoria mientras la app está
 * abierta: al volver a la sección de Tasks las actividades ya están
 * disponibles en el primer render, así que las tareas-actividad no aparecen
 * un instante como "Actividad" antes de mostrar su nombre y color reales.
 */
let activitiesCache: { uid: string; items: Activity[] } | null = null;

/**
 * Hook ligero para la subcolección `activities`.
 * Expone lectura en tiempo real y operaciones CRUD básicas.
 */
export function useActivities() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const coll = useFirestoreCollection<Activity>(uid, 'activities');

  useEffect(() => {
    if (!uid || coll.loading) return;
    activitiesCache = { uid, items: coll.items };
  }, [uid, coll.loading, coll.items]);

  const cached = uid && activitiesCache?.uid === uid ? activitiesCache.items : null;

  return useMemo(() => ({
    activities: coll.loading && cached ? cached : coll.items,
    loading: coll.loading && !cached,
    addActivity: coll.add,
    updateActivity: coll.update,
    deleteActivity: coll.remove,
  }), [coll.items, coll.loading, coll.add, coll.update, coll.remove, cached]);
}
