import React from "react";
import { PrimaryButton } from "@fluentui/react";
import { useAuthgear } from "../auth/AuthgearContext";

const AccessDeniedPage: React.VFC = function AccessDeniedPage() {
  const { logout } = useAuthgear();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "16px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "24px" }}>Access Denied</h1>
      <p style={{ margin: 0, color: "#605e5c" }}>
        You do not have permission to access this portal.
      </p>
      <PrimaryButton onClick={logout}>Logout</PrimaryButton>
    </div>
  );
};

export default AccessDeniedPage;
