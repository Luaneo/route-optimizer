import { useEffect, useState } from 'react';
import { store, subscribe } from '@/services/store';

export function useStore() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  return store;
}
