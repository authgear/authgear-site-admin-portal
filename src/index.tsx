import React from "react";
import ReactDOM from "react-dom/client";
import authgear from "@authgear/web";
import App from "./App";

async function init() {
  try {
    await authgear.configure({
      endpoint: import.meta.env.VITE_AUTHGEAR_ENDPOINT,
      clientID: import.meta.env.VITE_AUTHGEAR_CLIENT_ID,
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
