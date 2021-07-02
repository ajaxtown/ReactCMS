import { Setting } from "@/__generated__/__types__";
import {
  ApolloClient,
  ApolloProvider,
  NormalizedCacheObject,
} from "@apollo/client";
import { NextComponentType, NextPageContext } from "next";
import { Provider } from "next-auth/client";
import { ComponentType } from "react";
import Head from "next/head";

interface IProps {
  apolloClient: ApolloClient<NormalizedCacheObject>;
  Layout: ComponentType<{ settings: Setting }>;
  settings: Setting;
  Component: NextComponentType<NextPageContext, any, {}>;
  props: any;
}
const Main = ({ apolloClient, Layout, settings, Component, props }: IProps) => {
  return (
    <Provider
      session={props.session}
      options={{ basePath: process.env.basePath + "/api/auth" }}
    >
      <Head>
        <link rel="icon" href={process.env.basePath + "/uploads/logo.png"} />
      </Head>
      <ApolloProvider client={apolloClient}>
        <Layout settings={settings}>
          <Component {...props} settings={settings} />
        </Layout>
      </ApolloProvider>
    </Provider>
  );
};

export default Main;
