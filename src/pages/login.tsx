import React, { useState } from "react";
import { getSession, signIn } from "next-auth/client";
import {
  Block,
  Button,
  Container,
  InputBlock,
  Row,
} from "../components/login.css";
import { message } from "antd";
import { useRouter } from "next/router";
import { SessionData } from "@/graphql/types";
import Head from "next/head";
import { initializeApollo } from "@/graphql/apollo";
import {
  ForgotPasswordDocument,
  ForgotPasswordMutation,
  ForgotPasswordMutationVariables,
} from "@/__generated__/queries/mutations.graphql";
import { LoginError } from "@/__generated__/__types__";

const key = "login";

type SessionResponse = { user: LoginError | SessionData };
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginView, setLoginView] = useState(true);

  const router = useRouter();

  const doLogin = async () => {
    message.loading({ content: "Please wait...", key });
    const result = await signIn("credentials", {
      redirect: false,
      password: password,
      email: email,
      callbackUrl: process.env.basePath + "/pages",
    });
    if (result && result.error) {
      error(result.error);
      return;
    }
    const session = (await getSession()) as SessionResponse;
    if (!session) {
      error("The request could not be processed at this time.");
      return;
    }
    if (session.user.__typename === "LoginError") {
      error(session.user.message);
      return;
    }
    if (session.user.__typename === "SessionData") {
      message.success({ content: "Verified..", key, duration: 5 });
      if (result && result.url) {
        document.location.href = result.url;
      } else {
        document.location.href = process.env.basePath + "/posts";
      }
    }
  };

  const showLostPasswordView = (e) => {
    e.preventDefault();
    setLoginView(false);
  };

  const showLoginView = (e) => {
    e.preventDefault();
    setLoginView(true);
  };

  const forgotPasswordAction = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const sanitisedLoginEmail = email.trim();
    if (sanitisedLoginEmail.length > 0) {
      e.currentTarget.disabled = true;
      const client = await initializeApollo();
      const res = await client.mutate<
        ForgotPasswordMutation,
        ForgotPasswordMutationVariables
      >({
        mutation: ForgotPasswordDocument,
        variables: {
          email: email,
        },
      });
      const data = res.data?.forgotPassword;

      if (data?.ok) {
        success("Check your email to reset your password!");
        router.push(`${process.env.basePath}/login`);
      } else {
        e.currentTarget.disabled = false;
        warn(data?.message || "Something wrong hapenned. Please try again.");
      }
    } else {
      warn("Email field is mandatory");
    }
  };

  return (
    <Container>
      <Head>
        <title>Login</title>
      </Head>
      <div className="login">
        <h1>Letterpad</h1>
        <Block isVisible={loginView}>
          <InputBlock>
            <input
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              data-testid="input-email"
            />
          </InputBlock>
          <InputBlock>
            <input
              type="password"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              autoComplete="off"
              onKeyUp={(e: React.KeyboardEvent) => {
                if (e.keyCode === 13) {
                  doLogin();
                }
              }}
              data-testid="input-password"
            />
          </InputBlock>
          <Row justify="space-between">
            <InputBlock>
              <a onClick={showLostPasswordView} className="forgot-pwd" href="#">
                Forgot password ?
              </a>
            </InputBlock>
          </Row>
          <br />
          <Row justify="center">
            <Button onClick={doLogin} data-testid="btn-login">
              Enter Now
            </Button>
          </Row>
        </Block>
        <Block isVisible={!loginView}>
          <InputBlock>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </InputBlock>
          <br />
          <Row justify="space-between">
            <Button contained secondary onClick={showLoginView}>
              Cancel
            </Button>
            &nbsp;&nbsp;
            <Button onClick={forgotPasswordAction}>Reset Password</Button>
          </Row>
        </Block>
      </div>
    </Container>
  );
};

export default LoginForm;

function error(content: string) {
  message.error({ content, key, duration: 5 });
}

function warn(content: string) {
  message.warn({ content, key, duration: 5 });
}
function success(content: string) {
  message.success({ content, key, duration: 5 });
}
