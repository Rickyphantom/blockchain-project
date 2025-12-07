'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type UploadForm = {
  title: string;
  description: string;
  pricePerToken: string;
  amount: string;
  fileName?: string;
  file?: File | null;
};

export type CartItem = {
  doc_id: number;
  title: string;
  price: string;
  amount: number;
  seller: string;
};

type AppStateType = {
  uploadForm: UploadForm;
  setUploadForm: (f: Partial<UploadForm>) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (doc_id: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

const AppStateContext = createContext<AppStateType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploadForm, setUploadFormState] = useState<UploadForm>(() => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('uploadForm') : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed ?? { title: '', description: '', pricePerToken: '', amount: '1', file: null };
    } catch {
      return { title: '', description: '', pricePerToken: '', amount: '1', file: null };
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('cart') : null;
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('searchQuery') : null;
      return raw ?? '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('uploadForm', JSON.stringify(uploadForm));
    } catch {}
  }, [uploadForm]);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      sessionStorage.setItem('searchQuery', searchQuery);
    } catch {}
  }, [searchQuery]);

  const setUploadForm = (payload: Partial<UploadForm>) => {
    setUploadFormState((prev) => ({ ...prev, ...payload }));
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      if (prev.some((p) => p.doc_id === item.doc_id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromCart = (doc_id: number) => {
    setCart((prev) => prev.filter((p) => p.doc_id !== doc_id));
  };

  return (
    <AppStateContext.Provider
      value={{
        uploadForm,
        setUploadForm,
        cart,
        addToCart,
        removeFromCart,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
};