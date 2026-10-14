import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Spinner, Table, Text } from "@radix-ui/themes";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import ScreenTitle from "../components/ScreenTitle";
import PaginationWidget from "../components/PaginationWidget";
import { Callout } from "../components/v2/Callout/Callout";
import { listAuditLogs } from "../api/siteadmin";
import { SiteAdminAPIError } from "../api/client";
import type { SiteAdminAuditLog } from "../api/types";
import { formatTimestamp } from "../utils/date";
import styles from "./SiteAdminAuditLogScreen.module.css";

const PAGE_SIZE = 20;

type SortOrder = "asc" | "desc";

const SiteAdminAuditLogScreen: React.VFC = function SiteAdminAuditLogScreen() {
  const [logs, setLogs] = useState<SiteAdminAuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SiteAdminAPIError | null>(null);
  const [order, setOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listAuditLogs({ page: currentPage, page_size: PAGE_SIZE, order })
      .then((res) => {
        setLogs(res.audit_logs);
        setTotalCount(res.total_count);
      })
      .catch((err: SiteAdminAPIError) => setError(err))
      .finally(() => setLoading(false));
  }, [currentPage, order]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const onChangeOffset = useCallback((offset: number) => {
    setCurrentPage(Math.floor(offset / PAGE_SIZE) + 1);
  }, []);

  const onToggleOrder = useCallback(() => {
    setOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(1);
  }, []);

  const showTable = loading || logs.length > 0;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <ScreenTitle>Site Admin Log</ScreenTitle>
      </div>
      <div className={styles.content}>
        {error && (
          <Callout type="error" text={error.message} showCloseButton={false} />
        )}
        <div className={styles.tableArea}>
          {showTable ? (
            <div className={styles.tableWrapper}>
              <Table.Root className={styles.table} variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell className={styles.activityColumn}>
                      Activity Type
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className={styles.appColumn}>
                      Affected App
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell
                      className={styles.timestampColumn}
                      aria-sort={order === "asc" ? "ascending" : "descending"}
                    >
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={onToggleOrder}
                        aria-label="Sort by Timestamp"
                      >
                        Timestamp
                        {order === "asc" ? (
                          <ArrowUpIcon className={styles.sortIcon} />
                        ) : (
                          <ArrowDownIcon className={styles.sortIcon} />
                        )}
                      </button>
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {loading ? (
                    <Table.Row>
                      <Table.Cell colSpan={3}>
                        <div className={styles.loading}>
                          <Spinner />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    logs.map((item) => (
                      <Table.Row key={item.id}>
                        <Table.Cell className={styles.activityColumn}>
                          <Link
                            to={`/audit-logs/${item.id}`}
                            className={styles.cellLink}
                          >
                            {item.activity_type}
                          </Link>
                        </Table.Cell>
                        <Table.Cell className={styles.appColumn}>
                          <Text as="span" size="2" color="gray">
                            {item.affected_app_id ?? "—"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell className={styles.timestampColumn}>
                          <Text as="span" size="2" color="gray">
                            {formatTimestamp(item.created_at)}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </div>
          ) : !error ? (
            <Text as="p" size="2" color="gray" className={styles.emptyText}>
              No site admin log entries.
            </Text>
          ) : null}
          {totalPages > 1 && (
            <PaginationWidget
              className={styles.pagination}
              offset={(safePage - 1) * PAGE_SIZE}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              onChangeOffset={onChangeOffset}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteAdminAuditLogScreen;
