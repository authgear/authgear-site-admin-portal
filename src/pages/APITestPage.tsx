/**
 * TEMPORARY — delete this page once API connectivity is confirmed.
 * Access at: /api-test
 */
import React, { useState } from "react";
import { PrimaryButton, Text } from "@fluentui/react";
import { listApps } from "../api/siteadmin";
import { SiteAdminAPIError } from "../api/client";
import { SITEADMIN_API_URL } from "../config";

const APITestPage: React.VFC = function APITestPage() {
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );

  const handleTest = () => {
    setStatus("loading");
    setResult(null);
    listApps({ page: 1, page_size: 5 })
      .then((data) => {
        setStatus("ok");
        setResult(JSON.stringify(data, null, 2));
      })
      .catch((err: unknown) => {
        setStatus("error");
        if (err instanceof SiteAdminAPIError) {
          setResult(
            `SiteAdminAPIError\ncode: ${err.code}\nname: ${err.errorName}\nreason: ${err.reason}\nmessage: ${err.message}`
          );
        } else {
          setResult(String(err));
        }
      });
  };

  const statusColor =
    status === "ok" ? "#107c10" : status === "error" ? "#d13438" : "#605e5c";

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <Text variant="xLarge" block style={{ marginBottom: 8 }}>
        API Connection Test
      </Text>
      <Text
        variant="small"
        block
        style={{ color: "#605e5c", marginBottom: 24 }}
      >
        Calls <code>GET {SITEADMIN_API_URL}/api/v1/apps</code> using the current
        Authgear session token.
      </Text>

      <PrimaryButton
        text={status === "loading" ? "Testing…" : "Test listApps()"}
        disabled={status === "loading"}
        onClick={handleTest}
        style={{ marginBottom: 24 }}
      />

      {result !== null && (
        <>
          <Text
            variant="mediumPlus"
            block
            style={{ color: statusColor, marginBottom: 8, fontWeight: 600 }}
          >
            {status === "ok" ? "Success" : "Error"}
          </Text>
          <pre
            style={{
              background: "#f3f2f1",
              padding: 16,
              borderRadius: 4,
              overflowX: "auto",
              fontSize: 13,
              color: statusColor,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {result}
          </pre>
        </>
      )}
    </div>
  );
};

export default APITestPage;
