import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { AppData } from '@/domain/types';
import { reducer } from './reducer';
import type { Action } from './reducer';
import { loadData, saveData } from './storage';

interface StoreValue {
  data: AppData;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, null, loadData);

  // Skip the write the first render would trigger: it would only rewrite
  // what was just read, and in StrictMode it runs twice.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    saveData(data);
  }, [data]);

  const value = useMemo(() => ({ data, dispatch }), [data]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be called inside <StoreProvider>');
  return value;
}
