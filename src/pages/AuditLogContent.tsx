import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShimmeredDetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  IDetailsRowProps,
  DetailsRow,
  ColumnActionsMode,
  Text,
  Icon,
  IconButton,
  IListProps,
  MessageBar,
  MessageBarType,
} from "@fluentui/react";
import { listAuditLogs } from "../api/siteadmin";
import { SiteAdminAPIError } from "../api/client";
import type { SiteAdminAuditLog } from "../api/types";
import { formatTimestamp } from "../utils/date";
import styles from "./AuditLogContent.module.css";

function onShouldVirtualize(_: IListProps): boolean {
  return false;
}

const PAGE_SIZE = 20;

const COLUMN_WIDTHS = {
  activityType: 420,
  createdAt: 260,
} as const;

type SortOrder = "asc" | "desc";
type PageItem = number | "ellipsis";

function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const delta = 2;
  const keep = new Set<number>([1, total]);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= total) keep.add(i);
  }
  const sorted = Array.from(keep).sort((a, b) => a - b);
  const result: PageItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(sorted[i]);
  }
  return result;
}

interface AuditLogContentProps {
  appId: string;
}

const AuditLogContent: React.VFC<AuditLogContentProps> =
  function AuditLogContent({ appId }) {
    const [logs, setLogs] = useState<SiteAdminAuditLog[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<SiteAdminAPIError | null>(null);
    const [order, setOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
      setLoading(true);
      setError(null);
      listAuditLogs({
        affected_app_id: appId,
        page: currentPage,
        page_size: PAGE_SIZE,
        order,
      })
        .then((res) => {
          setLogs(res.audit_logs);
          setTotalCount(res.total_count);
        })
        .catch((err: SiteAdminAPIError) => setError(err))
        .finally(() => setLoading(false));
    }, [appId, currentPage, order]);

    const columns: IColumn[] = useMemo(
      () => [
        {
          key: "activityType",
          fieldName: "activity_type",
          name: "Activity Type",
          minWidth: COLUMN_WIDTHS.activityType,
          maxWidth: COLUMN_WIDTHS.activityType,
          columnActionsMode: ColumnActionsMode.disabled,
        },
        {
          key: "createdAt",
          fieldName: "created_at",
          name: "Timestamp",
          minWidth: COLUMN_WIDTHS.createdAt,
          maxWidth: COLUMN_WIDTHS.createdAt,
          columnActionsMode: ColumnActionsMode.disabled,
        },
      ],
      []
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const onFirstPage = useCallback(() => setCurrentPage(1), []);
    const onPrevPage = useCallback(() => {
      setCurrentPage((p) => Math.max(1, p - 1));
    }, []);
    const onNextPage = useCallback(() => {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }, [totalPages]);
    const onLastPage = useCallback(
      () => setCurrentPage(totalPages),
      [totalPages]
    );
    const onPageClick = useCallback((page: number) => setCurrentPage(page), []);

    const onToggleOrder = useCallback(() => {
      setOrder((prev) => (prev === "desc" ? "asc" : "desc"));
      setCurrentPage(1);
    }, []);

    const onRenderRow = useCallback(
      (props?: IDetailsRowProps) => {
        if (props == null) return null;
        const item = props.item as SiteAdminAuditLog;
        return (
          <Link
            to={`/project/${appId}/audit-log/${item.id}`}
            className={styles.rowLink}
          >
            <DetailsRow {...props} />
          </Link>
        );
      },
      [appId]
    );

    const onRenderItemColumn = useCallback(
      (item: SiteAdminAuditLog, _index?: number, column?: IColumn) => {
        switch (column?.key) {
          case "activityType":
            return (
              <Link
                to={`/project/${appId}/audit-log/${item.id}`}
                className={styles.cellLink}
              >
                {item.activity_type}
              </Link>
            );
          case "createdAt":
            return (
              <Text className={styles.cellText}>
                {formatTimestamp(item.created_at)}
              </Text>
            );
          default:
            return null;
        }
      },
      [appId]
    );

    return (
      <div className={styles.root}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {error.message}
          </MessageBar>
        )}
        <div className={styles.listContainer}>
          {(loading || logs.length > 0) && (
            <div className={styles.tableHeader}>
              <div
                className={styles.tableHeaderCell}
                style={{ width: COLUMN_WIDTHS.activityType }}
              >
                Activity Type
              </div>
              <button
                type="button"
                className={`${styles.tableHeaderCell} ${styles.tableHeaderSortable}`}
                style={{ width: COLUMN_WIDTHS.createdAt }}
                onClick={onToggleOrder}
                aria-label="Sort by Timestamp"
              >
                Timestamp
                <Icon
                  iconName={order === "asc" ? "SortUp" : "SortDown"}
                  className={styles.sortIcon}
                  style={{ marginLeft: 4 }}
                />
              </button>
            </div>
          )}
          <ShimmeredDetailsList
            className={styles.list}
            enableShimmer={loading}
            enableUpdateAnimations={false}
            onRenderRow={onRenderRow}
            onRenderItemColumn={onRenderItemColumn}
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.fixedColumns}
            columns={columns}
            items={logs}
            onShouldVirtualize={onShouldVirtualize}
          />
          {!loading && logs.length === 0 && !error && (
            <div className={styles.emptyState}>
              <Text className={styles.emptyText}>
                No site admin log entries.
              </Text>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <IconButton
              iconProps={{ iconName: "DoubleChevronLeft" }}
              title="First page"
              ariaLabel="First page"
              disabled={safePage === 1}
              onClick={onFirstPage}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: {
                  backgroundColor: "transparent",
                  color: "#C8C6C4",
                },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <IconButton
              iconProps={{ iconName: "ChevronLeft" }}
              title="Previous page"
              ariaLabel="Previous page"
              disabled={safePage === 1}
              onClick={onPrevPage}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: {
                  backgroundColor: "transparent",
                  color: "#C8C6C4",
                },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <div className={styles.paginationPages}>
              {getPageItems(safePage, totalPages).map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className={styles.paginationEllipsis}
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={
                      item === safePage
                        ? `${styles.paginationPageBtn} ${styles.paginationCurrent}`
                        : styles.paginationPageBtn
                    }
                    onClick={() => onPageClick(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === safePage ? "page" : undefined}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            <IconButton
              iconProps={{ iconName: "ChevronRight" }}
              title="Next page"
              ariaLabel="Next page"
              disabled={safePage === totalPages}
              onClick={onNextPage}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: {
                  backgroundColor: "transparent",
                  color: "#C8C6C4",
                },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <IconButton
              iconProps={{ iconName: "DoubleChevronRight" }}
              title="Last page"
              ariaLabel="Last page"
              disabled={safePage === totalPages}
              onClick={onLastPage}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: {
                  backgroundColor: "transparent",
                  color: "#C8C6C4",
                },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
          </div>
        )}
      </div>
    );
  };

export default AuditLogContent;
