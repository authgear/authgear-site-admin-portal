import React from "react";
import { PrimaryButton, Text } from "@fluentui/react";
import { useAuthgear } from "./AuthgearContext";
import Logo from "../components/Logo";
import { PORTAL_URL } from "../config";

const LoginPage: React.VFC = function LoginPage() {
  const { startLogin } = useAuthgear();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "24px",
      }}
    >
      <Logo />
      <Text variant="xLarge">Authgear Site Admin Portal</Text>
      <Text variant="small" style={{ color: "#605e5c" }}>
        {PORTAL_URL}
      </Text>
      <PrimaryButton text="Sign in" onClick={startLogin} />
    </div>
  );
};

export default LoginPage;
