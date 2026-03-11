import { create } from 'zustand';
import type { Property } from '@mansil/types';
import api from '../lib/api';

interface PropertiesState {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: (signal?: AbortSignal) => Promise<void>;
}

export const useProperties = create<PropertiesState>()((set) => ({
  properties: [],
  loading: true,
  error: null,

  fetchProperties: async (signal?: AbortSignal) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/properties', { signal });
      set({ properties: res.data, loading: false });
    } catch (error: any) {
      if (error?.name === 'CanceledError') return;
      const message = error.response
        ? error.response.status >= 500
          ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          : '데이터를 불러올 수 없습니다.'
        : '네트워크 연결을 확인해주세요.';
      set({ error: message, loading: false });
    }
  },
}));
