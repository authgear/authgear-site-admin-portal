/**
 * TEMPORARY — delete this page once API connectivity is confirmed.
 * Access at: /api-test
 */
import React, { useState } from "react";
import cn from "classnames";
import { Code, Heading, Text } from "@radix-ui/themes";
import { listApps } from "../api/siteadmin";
import { SiteAdminAPIError } from "../api/client";
import { SITEADMIN_API_URL } from "../config";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
import styles from "./APITestPage.module.css";

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

  const statusClassName =
    status === "ok"
      ? styles.resultOk
      : status === "error"
        ? styles.resultError
        : styles.resultIdle;

  return (
    <div className={styles.root}>
      <Heading as="h1" size="6" className={styles.title}>
        API Connection Test
      </Heading>
      <Text as="p" size="2" color="gray" className={styles.description}>
        Calls <Code>GET {SITEADMIN_API_URL}/api/v1/apps</Code> using the current
        Authgear session token.
      </Text>

      <div className={styles.button}>
        <PrimaryButton
          size="2"
          text={status === "loading" ? "Testing…" : "Test listApps()"}
          disabled={status === "loading"}
          onClick={handleTest}
        />
      </div>

      {result !== null && (
        <>
          <Text
            as="p"
            size="3"
            weight="bold"
            className={cn(styles.statusLabel, statusClassName)}
          >
            {status === "ok" ? "Success" : "Error"}
          </Text>
          <pre className={cn(styles.result, statusClassName)}>{result}</pre>
        </>
      )}
    </div>
  );
};

export default APITestPage;
