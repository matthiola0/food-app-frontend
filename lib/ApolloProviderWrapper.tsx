// lib/ApolloProviderWrapper.tsx
"use client";

import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import React from 'react';

// 這個函式會建立一個能夾帶 Token 的 Apollo Client
const createApolloClient = (getToken: () => Promise<string | null>) => {
  const httpLink = createHttpLink({
    uri: 'http://localhost:3000/graphql',
  });

  // 設定 authLink，它會在每個請求發出前，先取得 token 並加入到 header
  const authLink = setContext(async (_, { headers }) => {
    const token = await getToken();
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
};

// 讓元件的 props 可以接收 idToken
export function ApolloProviderWrapper({
  children,
  idToken,
}: {
  children: React.ReactNode;
  idToken: Promise<string> | null; // <-- 加上這個 props 型別定義
}) {
  // 使用 React.useCallback 和 React.useMemo 來優化效能，避免不必要的重複建立
  const getToken = React.useCallback(async () => {
    if (!idToken) return null;
    return await idToken;
  }, [idToken]);

  const client = React.useMemo(() => createApolloClient(getToken), [getToken]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}