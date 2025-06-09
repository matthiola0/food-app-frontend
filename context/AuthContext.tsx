// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';
import { ApolloProviderWrapper } from '@/lib/ApolloProviderWrapper';

// 定義 Context 的內容
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// 建立 Context
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// 建立一個 Provider 元件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged 是一個監聽器，當登入狀態改變時會觸發
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // 當元件卸載時，取消監聽
    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {/* 我們需要重新設定 Apollo Client 來傳遞 token，所以把 Provider 包在這裡 */}
      <ApolloProviderWrapper idToken={user ? user.getIdToken() : null}>
        {!loading && children}
      </ApolloProviderWrapper>
    </AuthContext.Provider>
  );
}

// 建立一個 custom hook，方便其他元件使用
export const useAuth = () => {
  return useContext(AuthContext);
};