import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IconButton, Text } from "@radix-ui/themes";
import {
  CheckIcon,
  CopyIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import PageHeader from "../components/PageHeader";
import ShowLoading from "../components/ShowLoading";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
import { getAuditLog } from "../api/siteadmin";
import { SiteAdminAPIError } from "../api/client";
import type { SiteAdminAuditLogDetail } from "../api/types";
import CodeBlock from "../components/CodeBlock";
import { formatTimestamp } from "../utils/date";
import styles from "./AuditLogDetailPage.module.css";

function getClientId(data: Record<string, unknown>): string | undefined {
  const context = data.context;
  if (
    context != null &&
    typeof context === "object" &&
    !Array.isArray(context)
  ) {
    const clientId = (context as Record<string, unknown>).client_id;
    if (typeof clientId === "string") return clientId;
  }
  return undefined;
}

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
}

const FieldRow: React.VFC<FieldRowProps> = ({ label, value }) => (
  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>{label}:</span>
    <span className={styles.fieldValue}>{value}</span>
  </div>
);

const AuditLogDetailPage: React.VFC = function AuditLogDetailPage() {
  const { projectId, logId } = useParams<"projectId" | "logId">();
  const navigate = useNavigate();

  const [log, setLog] = useState<SiteAdminAuditLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SiteAdminAPIError | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const onCopy = useCallback(() => {
    if (!log) return;
    void navigator.clipboard.writeText(JSON.stringify(log.data, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, [log]);
  useEffect(() => {
    if (!logId) return;
    setLoading(true);
    setLog(null);
    setError(null);
    getAuditLog(logId)
      .then(setLog)
      .catch((err: SiteAdminAPIError) => setError(err))
      .finally(() => setLoading(false));
  }, [logId]);

  if (loading) {
    return (
      <div className={styles.root}>
        <ShowLoading />
      </div>
    );
  }

  const header = (
    <PageHeader
      backLink={
        projectId
          ? { to: `/project/${projectId}#audit-log`, label: projectId }
          : { to: "/audit-logs", label: "Site Admin Log" }
      }
      title="Log Details"
    />
  );

  const backPath = projectId
    ? `/project/${projectId}#audit-log`
    : "/audit-logs";

  if (error != null || log == null) {
    return (
      <div className={styles.root}>
        {header}
        <div className={styles.notFoundContainer}>
          <MagnifyingGlassIcon
            className={styles.notFoundIcon}
            aria-hidden={true}
          />
          <Text
            as="p"
            size="5"
            weight="bold"
            className={styles.notFoundHeading}
          >
            Log entry not found
          </Text>
          <Text
            as="p"
            size="2"
            color="gray"
            className={styles.notFoundDescription}
          >
            {error?.message ??
              "This audit log entry doesn’t exist or may have been removed."}
          </Text>
          <PrimaryButton
            size="2"
            text={projectId ? "Back to Project" : "Back to Site Admin Logs"}
            onClick={() => navigate(backPath)}
          />
        </div>
      </div>
    );
  }

  const clientId = getClientId(log.data);
  const formattedTimestamp = formatTimestamp(log.created_at);
  const rawJson = JSON.stringify(log.data, null, 2);

  return (
    <div className={styles.root}>
      {header}

      <div className={styles.fields}>
        <FieldRow label="Activity Type" value={log.activity_type} />
        <FieldRow label="Logged at" value={formattedTimestamp} />
        {log.actor_user_id && (
          <FieldRow label="User ID" value={log.actor_user_id} />
        )}
        {log.ip_address && (
          <FieldRow label="IP Address" value={log.ip_address} />
        )}
        {log.user_agent && (
          <FieldRow label="User Agent" value={log.user_agent} />
        )}
        {clientId && <FieldRow label="Client ID" value={clientId} />}
      </div>

      <div className={styles.rawSection}>
        <div className={styles.rawHeader}>
          <span className={styles.rawTitle}>Raw Event Log</span>
          <IconButton
            type="button"
            variant="ghost"
            color="gray"
            size="2"
            className={styles.copyButton}
            title="Copy"
            aria-label="Copy raw log"
            onClick={onCopy}
          >
            {copyFeedback ? <CheckIcon /> : <CopyIcon />}
          </IconButton>
        </div>
        <CodeBlock
          className={styles.codeBlock}
          value={rawJson}
          language="json"
        />
      </div>
    </div>
  );
};

export default AuditLogDetailPage;
