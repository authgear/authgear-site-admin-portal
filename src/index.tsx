import React from "react";
import ReactDOM from "react-dom/client";
import authgear from "@authgear/web";
import App from "./App";
import { AUTHGEAR_ENDPOINT, AUTHGEAR_CLIENT_ID } from "./config";

// Light mode only for now. The class matches the Authgear portal's, so the
// color overrides and any dark mode added later key off the same selector.
document.documentElement.classList.add("light-theme");

async function init() {
  try {
    await authgear.configure({
      endpoint: AUTHGEAR_ENDPOINT,
      clientID: AUTHGEAR_CLIENT_ID,
      sessionType: "refresh_token",
    });
  } finally {
    const root = ReactDOM.createRoot(
      document.getElementById("root") as HTMLElement
    );
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

init().catch((e) => {
  console.error("Authgear init failed:", e);
});
