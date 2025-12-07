'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { readLocalStorage, writeLocalStorage, readSessionStorage, writeSessionStorage } from '@/lib/typedStorage';

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
  const [uploadForm, setUploadFormState] = useState<UploadForm>(() =>
    readSessionStorage<UploadForm | null>('uploadForm', null) ?? { title: '', description: '', pricePerToken: '', amount: '1', file: null }
  );

  const [cart, setCart] = useState<CartItem[]>(() =>
    readLocalStorage<CartItem[]>('cart', [])
  );

  const [searchQuery, setSearchQuery] = useState<string>(() =>
    readSessionStorage<string>('searchQuery', '')
  );

  useEffect(() => {
    writeSessionStorage<UploadForm>('uploadForm', uploadForm);
  }, [uploadForm]);

  useEffect(() => {
    writeLocalStorage<CartItem[]>('cart', cart);
  }, [cart]);

  useEffect(() => {
    writeSessionStorage<string>('searchQuery', searchQuery);
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