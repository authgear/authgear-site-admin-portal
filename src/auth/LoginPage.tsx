import React from "react";
import { Heading, Text } from "@radix-ui/themes";
import { useAuthgear } from "./AuthgearContext";
import Logo from "../components/Logo";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
import { PORTAL_URL } from "../config";
import styles from "./LoginPage.module.css";

const LoginPage: React.VFC = function LoginPage() {
  const { startLogin } = useAuthgear();

  return (
    <div className={styles.root}>
      <Logo />
      <div className={styles.heading}>
        <Heading as="h1" size="6" weight="bold">
          Authgear Site Admin Portal
        </Heading>
        <Text as="p" size="2" color="gray">
          {PORTAL_URL}
        </Text>
      </div>
      <PrimaryButton size="3" text="Sign in" onClick={startLogin} />
    </div>
  );
};

export default LoginPage;
