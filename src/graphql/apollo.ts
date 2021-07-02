import { getSession } from "next-auth/client";
import { SessionData } from "./types";
import { IncomingMessage, ServerResponse } from "http";
import { useMemo } from "react";
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client";
import models from "./db/models";

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

export type ResolverContext = {
  req?: IncomingMessage;
  res?: ServerResponse;
  models?: typeof models;
  session?: { user: SessionData };
  author_id?: number;
};

function createIsomorphLink(context: ResolverContext = {}) {
  if (typeof window === "undefined") {
    const { SchemaLink } = require("@apollo/client/link/schema");
    const { schema } = require("./schema");
    return new SchemaLink({ schema, context });
  } else {
    const { HttpLink } = require("@apollo/client");

    const basePath = process.env.basePath;
    return new HttpLink({
      uri: basePath + "/api/graphql",
      credentials: "same-origin",
    });
  }
}

export function createApolloClient(context?: ResolverContext) {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: createIsomorphLink(context),
    cache: new InMemoryCache(),
  });
}

export async function initializeApollo(
  initialState: any = null,
  // Pages with Next.js data fetching methods, like `getStaticProps`, can send
  // a custom context which will be used by `SchemaLink` to server render pages
  context?: ResolverContext,
) {
  let session;
  if (typeof window === "undefined") {
    if (!context) {
      console.error(
        "`initializeApollo` has been called without setting a context",
      );
    }
    const isBuildRunning = process.env.NEXT_PHASE === "phase-production-build";
    if (!isBuildRunning) session = await getSession(context);
  }
  const _apolloClient =
    apolloClient ?? createApolloClient({ ...context, session });

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // get hydrated here
  if (initialState) {
    _apolloClient.cache.restore(initialState);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(initialState: any) {
  return useMemo(() => initializeApollo(initialState), [initialState]);
}
