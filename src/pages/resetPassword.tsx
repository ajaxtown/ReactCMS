import React, { useState } from "react";

import { message } from "antd";
import { useRouter } from "next/router";
import { initializeApollo } from "@/graphql/apollo";
import {
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
  ResetPasswordDocument,
} from "@/__generated__/queries/mutations.graphql";
import {
  Button,
  Container,
  InputBlock,
  Row,
  Block,
} from "@/components/login.css";
import Head from "next/head";

const key = "change-password";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const resetPassword = async (e) => {
    e.preventDefault();
    if (password.length === 0) {
      message.error({
        content: "Password cannot be empty",
        duration: 5000,
        key,
      });
      return;
    }

    if (!router.query.token) {
      message.error({
        content: "Token is missing",
        duration: 5000,
        key,
      });
      return;
    }

    const client = await initializeApollo();

    const result = await client.mutate<
      ResetPasswordMutation,
      ResetPasswordMutationVariables
    >({
      mutation: ResetPasswordDocument,
      variables: {
        token: router.query.token as string,
        password,
      },
    });

    const data = result.data?.resetPassword;
    if (data && data.ok) {
      message.success({
        content: data.message,
        duration: 1000,
        key,
      });
      router.push(`${process.env.basePath}/login`);
    } else if (!data?.ok) {
      message.error({
        content:
          data?.message ||
          "There was a problem making this request. Contact the admin.",
        duration: 5000,
        key,
      });
    }
  };

  return (
    <Container>
      <Head>
        <title>Reset password</title>
      </Head>
      <Block isVisible={true}>
        <div className="login">
          <InputBlock>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your new password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              autoComplete="off"
            />
          </InputBlock>
          <br />
          <Row justify="space-between">
            <Button onClick={resetPassword}>Reset Password</Button>
          </Row>
        </div>
      </Block>
    </Container>
  );
};

export default ResetPassword;

// const Container = styled.div`
//   /* .login-view { */
//   color: #dcdcdc;
//   background-repeat: no-repeat;
//   background-size: cover;
//   /* .login-wrapper { */
//   display: flex;
//   justify-content: space-around;
//   align-items: center;
//   height: 100vh;

//   .brand {
//     text-align: center;
//     text-shadow: none;
//     color: #151a21;
//     font-weight: 400;
//     font-size: 1.8rem;
//     margin-bottom: 14px;
//     font-family: "Source Sans Pro", sans-serif;
//   }
//   .login {
//     width: 100%;
//     max-width: 400px;
//     padding: 40px 20px;
//     form {
//       input {
//         text-transform: none;
//         border: 1px solid #eee;
//         color: #5a5b5c;
//         font-size: 13px;
//         width: 100%;
//       }
//       input:-webkit-autofill {
//         -webkit-box-shadow: 0 0 0px 1000px #f5f5f5 inset;
//       }
//       label {
//         display: block;
//         max-width: 100%;
//         margin-bottom: 5px;
//         font-weight: bold;
//         letter-spacing: 4px;
//         font-weight: 100;
//         text-transform: uppercase;
//         font-size: 11px;
//         margin-top: 19px;
//       }
//       .form-signin-heading {
//         margin-bottom: 18px;
//         font-size: 30px;
//         color: #5a5b5c;
//       }
//       .form-control {
//         position: relative;
//         height: auto;
//         padding: 9px 8px;
//         box-sizing: border-box;
//         border: 1px solid #fff;
//         background: #fff;
//         &:focus {
//           z-index: 2;
//         }
//       }
//       .remember-me {
//         display: flex;
//         align-items: center;
//         input {
//           width: 24px;
//         }
//       }
//     }
//     a.forgot-pwd {
//       color: #d7c8c8;
//     }
//     button {
//       border: 1px solid #eee;
//     }
//   }
//   /* } */
//   /* } */
// `;
