import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Text,
  Spinner,
  SpinnerSize,
  PrimaryButton,
  Icon,
  IconButton,
} from "@fluentui/react";
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
      <div
        className={styles.root}
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Spinner size={SpinnerSize.large} />
      </div>
    );
  }

  const breadcrumb = projectId ? (
    <Text as="h1" variant="xxLarge" block className={styles.breadcrumb}>
      <Link to="/" className={styles.breadcrumbLink}>
        Projects
      </Link>
      <Icon iconName="ChevronRight" className={styles.breadcrumbSepIcon} />
      <Link
        to={`/project/${projectId}#audit-log`}
        className={styles.breadcrumbLink}
      >
        Project Details
      </Link>
      <Icon iconName="ChevronRight" className={styles.breadcrumbSepIcon} />
      <span className={styles.breadcrumbCurrent}>Log Details</span>
    </Text>
  ) : (
    <Text as="h1" variant="xxLarge" block className={styles.breadcrumb}>
      <Link to="/audit-logs" className={styles.breadcrumbLink}>
        Site Admin Logs
      </Link>
      <Icon iconName="ChevronRight" className={styles.breadcrumbSepIcon} />
      <span className={styles.breadcrumbCurrent}>Log Details</span>
    </Text>
  );

  const backPath = projectId
    ? `/project/${projectId}#audit-log`
    : "/audit-logs";

  if (error != null || log == null) {
    return (
      <div className={styles.root}>
        <div className={styles.breadcrumbRow}>{breadcrumb}</div>
        <div className={styles.notFoundContainer}>
          <Icon iconName="SearchIssue" className={styles.notFoundIcon} />
          <h2 className={styles.notFoundHeading}>Log entry not found</h2>
          <p className={styles.notFoundDescription}>
            {error?.message ??
              "This audit log entry doesn’t exist or may have been removed."}
          </p>
          <PrimaryButton
            text={projectId ? "Back to Project" : "Back to Site Admin Logs"}
            onClick={() => navigate(backPath)}
            styles={{
              root: { backgroundColor: "#176df3", borderColor: "#176df3" },
              rootHovered: {
                backgroundColor: "#1562db",
                borderColor: "#1562db",
              },
            }}
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
      <div className={styles.breadcrumbRow}>{breadcrumb}</div>

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
            iconProps={{ iconName: copyFeedback ? "CheckMark" : "Copy" }}
            title="Copy"
            ariaLabel="Copy raw log"
            onClick={onCopy}
            styles={{
              root: { color: "#605e5c" },
              rootHovered: { color: "#323130", backgroundColor: "#edebe9" },
            }}
          />
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
