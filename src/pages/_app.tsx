import { AppProps } from "next/app";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { useApollo } from "@/graphql/apollo";
import { Provider } from "next-auth/client";
import { useRouter } from "next/router";
import type { Page } from "../page";
import { PropsWithChildren, useEffect, useState } from "react";
import { Setting } from "@/__generated__/__types__";
import ThemeSwitcher from "@/components/layouts/ThemeSwitcher";
import "lazysizes";
import Main from "@/components/main";
import { getSettings, initPageProgress } from "./../shared/utils";
import dynamic from "next/dynamic";

import "../../styles/globals.css";

type Props = AppProps & {
  Component: Page;
};

function App({ Component, pageProps }: Props) {
  const apolloClientPromise = useApollo(pageProps.initialApolloState);
  const [settings, setSettings] = useState<null | Setting>(null);
  const [apolloClient, setClient] =
    useState<ApolloClient<NormalizedCacheObject>>();
  const router = useRouter();

  const ComponentRequiresAuth = Component.needsAuth;

  useEffect(() => {
    if (ComponentRequiresAuth) {
      ThemeSwitcher.switch(localStorage.theme);
      initPageProgress();

      async function init() {
        const client = await apolloClientPromise;
        setClient(client);

        const { data } = await getSettings();
        if (data.settings?.__typename === "Setting") {
          return setSettings(data.settings);
        }
        router.push("/api/auth/signin");
      }
      init();
    }
  }, []);

  if (!ComponentRequiresAuth) {
    return (
      <Provider
        session={pageProps.session}
        options={{ basePath: process.env.basePath + "/api/auth" }}
      >
        <Component {...pageProps} />
      </Provider>
    );
  }

  const Layout = Component.layout || NoLayout;

  if (!apolloClient || !settings) return null;

  return (
    <Main
      apolloClient={apolloClient}
      Component={Component}
      Layout={Layout}
      props={{ ...pageProps }}
      settings={settings}
    />
  );
}

function NoLayout({ children }: PropsWithChildren<{ settings: Setting }>) {
  return <>{children}</>;
}

export default dynamic(() => Promise.resolve(App), {
  ssr: false,
});
