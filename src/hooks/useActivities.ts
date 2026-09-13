import { useAuth } from '../context/AuthContext';
import { useFirestoreCollection } from './useFirestoreCollection';
import type { Activity } from '../types';

/**
 * Hook ligero para la subcolección `activities`.
 * Expone lectura en tiempo real y operaciones CRUD básicas.
 */
export function useActivities() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const coll = useFirestoreCollection<Activity>(uid, 'activities');

  return {
    activities: coll.items,
    loading: coll.loading,
    addActivity: coll.add,
    updateActivity: coll.update,
    deleteActivity: coll.remove,
  };
}
