import React from "react";
import { Heading, Text } from "@radix-ui/themes";
import { useAuthgear } from "../auth/AuthgearContext";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
import styles from "../auth/LoginPage.module.css";

const AccessDeniedPage: React.VFC = function AccessDeniedPage() {
  const { logout } = useAuthgear();

  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <Heading as="h1" size="6" weight="bold">
          Access Denied
        </Heading>
        <Text as="p" size="2" color="gray">
          You do not have permission to access this portal.
        </Text>
      </div>
      <PrimaryButton
        size="3"
        text="Logout"
        onClick={() => {
          logout().catch(() => {});
        }}
      />
    </div>
  );
};

export default AccessDeniedPage;
