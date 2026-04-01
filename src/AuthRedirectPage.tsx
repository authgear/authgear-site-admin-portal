import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authgear from "@authgear/web";
import { useAuthgear } from "./AuthgearContext";

const AuthRedirectPage: React.VFC = function AuthRedirectPage() {
  const navigate = useNavigate();
  const { refreshSessionState } = useAuthgear();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authgear
      .finishAuthentication()
      .then(() => {
        refreshSessionState();
        navigate("/", { replace: true });
      })
      .catch((err) => {
        console.error("finishAuthentication failed:", err);
        setError(String(err));
      });
  }, [navigate, refreshSessionState]);

  if (error) {
    return <div>Authentication failed: {error}</div>;
  }

  return <div>Completing sign in…</div>;
};

export default AuthRedirectPage;
