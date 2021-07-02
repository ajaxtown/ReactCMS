import {
  LoginDocument,
  LoginMutation,
  LoginMutationVariables,
} from "@/__generated__/queries/mutations.graphql";
import { LoginResponse } from "@/__generated__/__types__";
import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import { initializeApollo } from "@/graphql/apollo";
import { NextApiRequest, NextApiResponse } from "next";

interface ICredentials {
  email: string;
  password: string;
  csrfToken: string;
}
const providers = [
  Providers.Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (
      credentials: ICredentials,
      req,
    ): Promise<LoginResponse> => {
      const apolloClient = await initializeApollo({}, { req });
      const result = await apolloClient.mutate<
        LoginMutation,
        LoginMutationVariables
      >({
        mutation: LoginDocument,
        variables: {
          data: {
            email: credentials.email,
            password: credentials.password,
          },
        },
      });

      if (result.data?.login?.__typename === "Author") {
        return {
          ...result.data.login,
          accessToken: credentials.csrfToken,
        };
      }

      if (result.data?.login?.__typename === "LoginError") {
        return result.data.login;
      }

      return {
        __typename: "LoginError",
        message:
          "We are facing issues logging you in. Please try after sometime",
      };
    },
  }),
];

const options = {
  providers,
  callbacks: {
    redirect: async (url: string, baseUrl: string) => {
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return process.env.ROOT_URL + "/posts";
    },
    jwt: async (token: any, user: Required<LoginResponse>) => {
      //  "user" parameter is the object received from "authorize"
      //  "token" is being send to "session" callback...
      //  ...so we set "user" param of "token" to object from "authorize"...
      //  ...and return it...
      if (user && token && user.__typename === "Author") {
        token.role = user.role;
        token.avatar = user.avatar;
        token.permissions = user.permissions;
        token.id = user.id;
        token.username = user.username;
        token.__typename = "SessionData";
      }
      if (user && user.__typename === "LoginError") {
        return Promise.resolve({ ...user });
      }
      return Promise.resolve(token);
    },
    session: async (session: any, user: LoginResponse) => {
      if (user.__typename === "LoginError") {
        session.user = user;
        return Promise.resolve(session);
      }
      session.user = { ...user };
      return Promise.resolve(session);
    },
  },
  jwt: {
    encryption: true,
    secret: process.env.SECRET_KEY,
  },
  pages: {
    signIn: `${process.env.basePath}/login`,
  },
};

export default (req: NextApiRequest, res: NextApiResponse) =>
  NextAuth(req, res, options);
