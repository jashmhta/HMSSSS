import React from "react";
import { AppProps } from "next/app";
import "../styles/globals.css";
import Layout from "../components/layout/Layout";

function MyApp({ Component, pageProps }: AppProps) {
  // Check if current page is auth page
  const isAuthPage =
    Component.name === "Login" ||
    Component.name === "Register" ||
    Component.name === "ForgotPassword";

  // Check user role from localStorage (in real app, this would come from auth context)
  const userRole =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

  if (isAuthPage) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout userRole={userRole || undefined}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
