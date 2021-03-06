import ApolloClient from "apollo-boost";
import Head from "next/head";
import { ApolloProvider } from "@apollo/react-hooks";
import fetch from "isomorphic-unfetch";
import { InMemoryCache } from "apollo-cache-inmemory";
import { IntrospectionFragmentMatcher } from "apollo-cache-inmemory";
import introspectionQueryResultData from "./fragmentTypes.json";

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData
});

export function withApollo(PageComponent) {
  const WithApollo = ({ apolloClient, apolloState, ...pageProps }) => {
    const client = apolloClient || initApolloClient(apolloState);

    return (
      <ApolloProvider client={client}>
        <PageComponent {...pageProps} />
      </ApolloProvider>
    );
  };

  WithApollo.getInitialProps = async ctx => {
    const { AppTree } = ctx;
    const apolloClient = (ctx.apollClient = initApolloClient());

    let pageProps = {};
    if (PageComponent.getInitialProps) {
      pageProps = await PageComponent.getInitialProps(ctx);
    }

    // If on server
    if (typeof window === "undefined") {
      if (ctx.res && ctx.res.finished) {
        return pageProps;
      }

      try {
        const { getDataFromTree } = await import("@apollo/react-ssr");
        console.log("hi ssr");
        await getDataFromTree(
          <AppTree
            pageProps={{
              ...pageProps,
              apolloClient
            }}
          />
        );
      } catch (e) {
        console.error(e);
      }

      Head.rewind();
    }

    const apolloState = apolloClient.cache.extract();
    return {
      ...pageProps,
      apolloState
    };
  };

  return WithApollo;
}

const initApolloClient = (initialState = {}) => {
  const ssrMode = typeof window === "undefined";
  const cache = new InMemoryCache({
    fragmentMatcher
  }).restore(initialState);

  const client = new ApolloClient({
    ssrMode,
    uri: "https://dev-the-cereal-shop-drupal.pantheonsite.io/graphql",
    fetch,
    cache
  });
  return client;
};
