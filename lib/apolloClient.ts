// lib/apolloClient.ts

import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
    // 這是您後端 GraphQL Playground 的網址
    uri: "http://localhost:3000/graphql", 
    cache: new InMemoryCache(),
});

export default client;