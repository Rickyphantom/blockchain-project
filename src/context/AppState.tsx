'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  doc_id: number;
  title: string;
  seller: string;
  price_per_token: string;
  amount: number;
  quantity: number;
}

interface AppStateContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (doc_id: number) => void;
  clearCart: () => void;
  updateQuantity: (doc_id: number, quantity: number) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.doc_id === item.doc_id);
      if (existing) {
        return prev.map((i) =>
          i.doc_id === item.doc_id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (doc_id: number) => {
    setCart((prev) => prev.filter((item) => item.doc_id !== doc_id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateQuantity = (doc_id: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => (item.doc_id === doc_id ? { ...item, quantity } : item))
    );
  };

  return (
    <AppStateContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}