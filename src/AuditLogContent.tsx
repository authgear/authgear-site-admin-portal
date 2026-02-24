import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Text,
  SearchBox,
  IDropdownOption,
  Icon,
  IconButton,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  IDetailsRowProps,
  DetailsRow,
  DefaultButton,
  PrimaryButton,
  Callout,
  DirectionalHint,
  Modal,
  Stack,
  TextField,
  Calendar,
  MessageBar,
  MessageBarType,
  Spinner,
} from "@fluentui/react";
import type { AuditLogEntry } from "./types/auditLog";
import { generateUserActivityLogs } from "./data/auditLog";
import styles from "./AuditLogContent.module.css";

const FLOW_ACTION_OPTIONS: IDropdownOption[] = [
  { key: "all", text: "All activity types" },
  { key: "SMS OTP", text: "SMS OTP" },
  { key: "Email OTP", text: "Email OTP" },
  { key: "WhatsApp OTP", text: "WhatsApp OTP" },
  { key: "Verify", text: "Verify" },
  { key: "Create Authenticator", text: "Create Authenticator" },
  { key: "Create Passkey", text: "Create Passkey" },
  { key: "Authenticate", text: "Authenticate" },
  { key: "Change Password", text: "Change Password" },
  { key: "User signed in", text: "User signed in" },
  { key: "Account created", text: "Account created" },
  { key: "Password changed", text: "Password changed" },
  { key: "Email verification sent", text: "Email verification sent" },
  { key: "Login failed", text: "Login failed" },
  { key: "2FA enrolled", text: "2FA enrolled" },
  { key: "Session expired", text: "Session expired" },
  { key: "Rate limit exceeded", text: "Rate limit exceeded" },
];

const ITEMS_PER_PAGE = 15;

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const timezoneOffset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(timezoneOffset) / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (Math.abs(timezoneOffset) % 60).toString().padStart(2, "0");
  const sign = timezoneOffset >= 0 ? "+" : "-";
  const timezone = `UTC${sign}${hours}:${minutes}`;
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  const hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, "0");
  const second = date.getSeconds().toString().padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${month} ${day}, ${year}, ${displayHour}:${minute}:${second} ${ampm} ${timezone}`;
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Snapshot of audit log filters for restoring when returning from log details */
export interface AuditLogFiltersSnapshot {
  searchQuery: string;
  flowActionFilter: string;
  dateRangeType: "full" | "custom";
  startDateIso: string | null;
  endDateIso: string | null;
  currentPage: number;
  timestampSortDirection: "asc" | "desc" | null;
}

interface AuditLogContentProps {
  projectId: string;
  initialFilters?: AuditLogFiltersSnapshot | null;
}

const AuditLogContent: React.VFC<AuditLogContentProps> = ({
  projectId,
  initialFilters,
}) => {
  const navigate = useNavigate();

  const parseInitialDate = (iso: string | null): Date | null =>
    iso ? (() => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : d; })() : null;

  const [logs, setLogs] = useState<AuditLogEntry[]>(() =>
    generateUserActivityLogs(projectId, 25)
  );
  const [searchQuery, setSearchQuery] = useState(
    () => initialFilters?.searchQuery ?? ""
  );
  const [flowActionFilter, setFlowActionFilter] = useState<string>(
    () => initialFilters?.flowActionFilter ?? "all"
  );
  const [dateRangeType, setDateRangeType] = useState<"full" | "custom">(
    () => initialFilters?.dateRangeType ?? "full"
  );
  const [startDate, setStartDate] = useState<Date | null>(
    () => parseInitialDate(initialFilters?.startDateIso ?? null)
  );
  const [endDate, setEndDate] = useState<Date | null>(
    () => parseInitialDate(initialFilters?.endDateIso ?? null)
  );
  const [currentPage, setCurrentPage] = useState(
    () => initialFilters?.currentPage ?? 1
  );
  const [timestampSortDirection, setTimestampSortDirection] = useState<
    "asc" | "desc" | null
  >(() => initialFilters?.timestampSortDirection ?? null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [showExportCsvModal, setShowExportCsvModal] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [activityDropdownOpen, setActivityDropdownOpen] = useState(false);
  const [activityDropdownSearch, setActivityDropdownSearch] = useState("");
  const startDateInputRef = useRef<HTMLDivElement>(null);
  const endDateInputRef = useRef<HTMLDivElement>(null);
  const activityDropdownTriggerRef = useRef<HTMLDivElement>(null);

  const effectiveFlowActionFilter = FLOW_ACTION_OPTIONS.some(
    (o) => o.key === flowActionFilter
  )
    ? flowActionFilter
    : "all";

  const activityDropdownFilteredOptions = useMemo(() => {
    if (!activityDropdownSearch.trim()) return FLOW_ACTION_OPTIONS;
    const q = activityDropdownSearch.trim().toLowerCase();
    return FLOW_ACTION_OPTIONS.filter((o) =>
      (o.text ?? String(o.key)).toLowerCase().includes(q)
    );
  }, [activityDropdownSearch]);

  const selectedActivityLabel =
    FLOW_ACTION_OPTIONS.find((o) => o.key === effectiveFlowActionFilter)
      ?.text ?? "All activity types";

  const exportDateRangeText = useMemo(() => {
    if (dateRangeType === "full") return "the full date range";
    const formatD = (d: Date) => {
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const day = d.getDate();
      const year = d.getFullYear();
      return `${month} ${day}, ${year}`;
    };
    if (startDate && endDate) return `${formatD(startDate)} to ${formatD(endDate)}`;
    if (startDate) return `from ${formatD(startDate)}`;
    if (endDate) return `until ${formatD(endDate)}`;
    return "the full date range";
  }, [dateRangeType, startDate, endDate]);

  const filteredLogs = useMemo(() => {
    let result = logs.filter((log) => {
      const matchesSearch =
        searchQuery === "" ||
        (log.userId ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFlowAction =
        effectiveFlowActionFilter === "all" ||
        log.flowAction === effectiveFlowActionFilter;

      let matchesDateRange = true;
      if (dateRangeType === "custom" && (startDate || endDate)) {
        const logDate = new Date(log.timestamp);
        if (startDate && logDate < startDate) matchesDateRange = false;
        if (endDate) {
          const endDateWithTime = new Date(endDate);
          endDateWithTime.setHours(23, 59, 59, 999);
          if (logDate > endDateWithTime) matchesDateRange = false;
        }
      }

      return matchesSearch && matchesFlowAction && matchesDateRange;
    });

    if (timestampSortDirection) {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return timestampSortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    return result;
  }, [
    logs,
    searchQuery,
    effectiveFlowActionFilter,
    dateRangeType,
    startDate,
    endDate,
    timestampSortDirection,
  ]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    if (totalPages >= 1 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `audit-log-logs-${projectId}`,
        JSON.stringify(logs)
      );
    } catch {
      // ignore
    }
  }, [logs, projectId]);

  useEffect(() => {
    if (isDateModalOpen) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [isDateModalOpen]);

  const handleTimestampSort = useCallback(() => {
    if (timestampSortDirection === null) setTimestampSortDirection("desc");
    else if (timestampSortDirection === "desc") setTimestampSortDirection("asc");
    else setTimestampSortDirection(null);
    setCurrentPage(1);
  }, [timestampSortDirection]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setFlowActionFilter("all");
    setDateRangeType("full");
    setStartDate(null);
    setEndDate(null);
    setTimestampSortDirection(null);
    setCurrentPage(1);
  }, []);

  const hasActiveFilters =
    searchQuery !== "" ||
    effectiveFlowActionFilter !== "all" ||
    (dateRangeType === "custom" && (startDate !== null || endDate !== null)) ||
    timestampSortDirection !== null;

  const runExportCsv = useCallback(async () => {
    setShowExportCsvModal(false);
    setIsExportingCsv(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const header = [
        "Activity Type",
        "Timestamp",
        "User ID",
        "Issue",
      ].map(escapeCsvCell).join(",");
      const rows = filteredLogs.map((log) =>
        [
          log.flowAction,
          formatTimestamp(log.timestamp),
          log.userId ?? "",
          log.verdict,
        ].map(escapeCsvCell).join(",")
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${projectId}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingCsv(false);
    }
  }, [filteredLogs, projectId]);

  const columns: IColumn[] = useMemo(
    () => [
      {
        key: "flowAction",
        name: "Activity Type",
        fieldName: "flowAction",
        minWidth: 200,
        maxWidth: 360,
        width: 280,
        isResizable: true,
        onRender: (item: AuditLogEntry) => {
          const index = logs.findIndex((l) => l.key === item.key);
          const detailUrl =
            index >= 0
              ? `/${projectId}/audit-log/${index}`
              : `/${projectId}/audit-log/0`;
          const auditLogFilters: AuditLogFiltersSnapshot = {
            searchQuery,
            flowActionFilter: effectiveFlowActionFilter,
            dateRangeType,
            startDateIso: startDate?.toISOString() ?? null,
            endDateIso: endDate?.toISOString() ?? null,
            currentPage,
            timestampSortDirection,
          };
          const detailState = {
            logEntry: {
              key: item.key,
              timestamp: item.timestamp,
              activity: item.flowAction,
              isError: item.verdict === "blocked",
            },
            userId: item.userId,
            auditLogFilters,
          };
          return (
            <span
              className={styles.activityTypeLink}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                navigate(detailUrl, { state: detailState });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(detailUrl, { state: detailState });
                }
              }}
            >
              {item.flowAction}
            </span>
          );
        },
      },
      {
        key: "timestamp",
        name: "Timestamp",
        fieldName: "timestamp",
        minWidth: 200,
        maxWidth: 360,
        width: 280,
        isResizable: true,
        onRenderHeader: () => (
          <div
            onClick={handleTimestampSort}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <span>Timestamp</span>
            {timestampSortDirection === "asc" && (
              <Icon
                iconName="SortUp"
                styles={{ root: { fontSize: 12, color: "#9ca3af" } }}
              />
            )}
            {timestampSortDirection === "desc" && (
              <Icon
                iconName="SortDown"
                styles={{ root: { fontSize: 12, color: "#9ca3af" } }}
              />
            )}
            {timestampSortDirection === null && (
              <Icon
                iconName="Sort"
                styles={{ root: { fontSize: 12, color: "#d1d5db" } }}
              />
            )}
          </div>
        ),
        onRender: (item: AuditLogEntry) => (
          <Text styles={{ root: { fontSize: 12, color: "#605E5C" } }}>
            {formatTimestamp(item.timestamp)}
          </Text>
        ),
      },
      {
        key: "userId",
        name: "User ID",
        fieldName: "userId",
        minWidth: 200,
        maxWidth: 360,
        width: 280,
        isResizable: true,
        onRender: (item: AuditLogEntry) => (
          <Text styles={{ root: { fontSize: 12, color: "#605E5C" } }}>
            {item.userId ?? "—"}
          </Text>
        ),
      },
      {
        key: "issue",
        name: "",
        minWidth: 56,
        maxWidth: 56,
        isResizable: false,
        onRenderHeader: () => null,
        onRender: (item: AuditLogEntry) => {
          const isFailed =
            /failed|exceeded|Invalid|Unauthorized|expired/i.test(item.flowAction);
          return isFailed ? (
            <Text
              styles={{
                root: {
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#d81010",
                  backgroundColor: "#fef2f2",
                  padding: "3px 8px",
                  borderRadius: 4,
                },
              }}
            >
              Error
            </Text>
          ) : null;
        },
      },
    ],
    [
      projectId,
      navigate,
      handleTimestampSort,
      searchQuery,
      effectiveFlowActionFilter,
      dateRangeType,
      startDate,
      endDate,
      currentPage,
      timestampSortDirection,
    ]
  );

  const onRenderRow = useCallback((props?: IDetailsRowProps) => {
    if (!props) return <></>;
    return (
      <div style={{ overflowX: "hidden", minWidth: 0 }}>
        <DetailsRow {...props} />
      </div>
    );
  }, []);

  const detailsListStyles = {
    root: { backgroundColor: "#ffffff" },
    contentWrapper: { overflowY: "visible" as const, overflowX: "hidden" as const },
    ".ms-List-surface": { overflow: "visible" as const, maxHeight: "none" as const },
    ".ms-List-page": { overflow: "visible" as const, maxHeight: "none" as const },
    ".ms-List-cell": { overflow: "visible" as const, maxHeight: "none" as const },
    ".ms-DetailsHeader": {
      paddingTop: 0,
      paddingBottom: 0,
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #edebe9",
    },
    ".ms-DetailsHeader-cell": {
      fontSize: 14,
      fontWeight: 600,
      color: "#201F1E",
      padding: "8px 16px",
      backgroundColor: "#ffffff",
    },
    ".ms-DetailsHeader-cellName": { fontSize: 14, fontWeight: 600, color: "#201F1E" },
    ".ms-DetailsRow": {
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #edebe9",
      minHeight: 40,
      selectors: { ":hover": { backgroundColor: "#f3f2f1 !important" } },
    },
    ".ms-DetailsRow-cell": {
      fontSize: 12,
      padding: "8px 16px",
      backgroundColor: "transparent",
      color: "#605E5C",
      textAlign: "left",
    },
    ".ms-DetailsRow-fields": { alignItems: "center" },
    '[data-automation-key="issue"]': {
      maxWidth: 56,
      minWidth: 56,
      width: 56,
      boxSizing: "border-box",
    },
  };

  return (
    <div className={styles.root}>
      <div className={styles.tabContent}>
        <div className={styles.filtersRowWrapper}>
          <div className={styles.filtersRow}>
            <DefaultButton
              iconProps={{ iconName: "Calendar" }}
              text={
                dateRangeType === "full"
                  ? "Full Date Range"
                  : "Custom Date Range"
              }
              menuProps={{
                items: [
                  {
                    key: "full",
                    text: "Full Date Range",
                    onClick: () => {
                      setDateRangeType("full");
                      setStartDate(null);
                      setEndDate(null);
                      setCurrentPage(1);
                    },
                  },
                  {
                    key: "custom",
                    text: "Custom Date Range",
                    onClick: () => {
                      setDateRangeType("custom");
                      setIsDateModalOpen(true);
                    },
                  },
                ],
              }}
              styles={{
                root: {
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#323130",
                  fontSize: 14,
                  height: "auto",
                  padding: "10px 8px",
                },
                icon: { fontSize: 14, color: "#176df3" },
                label: { fontSize: 14, fontWeight: 400 },
              }}
            />
            <div ref={activityDropdownTriggerRef} className={styles.activityDropdownTrigger}>
              <button
                type="button"
                className={styles.activityDropdownButton}
                onClick={() => {
                  setActivityDropdownOpen((o) => !o);
                  if (!activityDropdownOpen) setActivityDropdownSearch("");
                }}
                aria-expanded={activityDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className={styles.activityDropdownLabel}>
                  {selectedActivityLabel}
                </span>
                <Icon
                  iconName="ChevronDown"
                  styles={{ root: { fontSize: 12, color: "#605e5c" } }}
                />
              </button>
              {activityDropdownOpen && activityDropdownTriggerRef.current && (
                <Callout
                  target={activityDropdownTriggerRef.current}
                  directionalHint={DirectionalHint.bottomLeftEdge}
                  onDismiss={() => setActivityDropdownOpen(false)}
                  setInitialFocus={false}
                  role="listbox"
                  className={styles.activityDropdownCallout}
                >
                  <div className={styles.activityDropdownPanel}>
                    <div className={styles.activityDropdownSearchWrap}>
                      <SearchBox
                        placeholder="Search"
                        value={activityDropdownSearch}
                        onChange={(_, value) =>
                          setActivityDropdownSearch(value ?? "")
                        }
                        styles={{
                          root: { width: "100%" },
                          field: { backgroundColor: "#fff", fontSize: 14 },
                          icon: { color: "#605e5c" },
                        }}
                      />
                    </div>
                    <div className={styles.activityDropdownList}>
                      {activityDropdownFilteredOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          role="option"
                          aria-selected={
                            option.key === effectiveFlowActionFilter
                          }
                          className={styles.activityDropdownOption}
                          onClick={() => {
                            setFlowActionFilter((option.key as string) ?? "all");
                            setCurrentPage(1);
                            setActivityDropdownOpen(false);
                          }}
                        >
                          {option.text}
                        </button>
                      ))}
                      {activityDropdownFilteredOptions.length === 0 && (
                        <div className={styles.activityDropdownEmpty}>
                          No matches
                        </div>
                      )}
                    </div>
                  </div>
                </Callout>
              )}
            </div>
            <SearchBox
              placeholder="Search User ID"
              value={searchQuery}
              onChange={(_, value) => {
                setSearchQuery(value ?? "");
                setCurrentPage(1);
              }}
              styles={{
                root: { width: 260 },
                field: { backgroundColor: "#ffffff", color: "#323130" },
                icon: { color: "#9ca3af" },
              }}
            />
            <DefaultButton
              text="Export CSV"
              onRenderIcon={() =>
                isExportingCsv ? (
                  <Spinner
                    size={0}
                    styles={{ root: { marginRight: 8 } }}
                  />
                ) : (
                  <Icon iconName="Download" styles={{ root: { fontSize: 12 } }} />
                )
              }
              disabled={isExportingCsv}
              onClick={() => setShowExportCsvModal(true)}
              styles={{
                root: {
                  borderColor: "#edebe9",
                  color: "#323130",
                  fontSize: 13,
                  selectors: {
                    "[disabled]": {
                      backgroundColor: "#f3f2f1",
                      color: "#a19f9d",
                      borderColor: "#edebe9",
                      cursor: "not-allowed",
                    },
                  },
                },
                icon: { fontSize: 12 },
              }}
            />
            {hasActiveFilters && (
              <DefaultButton
                text="Clear filters"
                onClick={handleClearFilters}
                iconProps={{ iconName: "Clear" }}
                styles={{
                  root: {
                    borderColor: "#edebe9",
                    color: "#323130",
                    fontSize: 13,
                  },
                  icon: { fontSize: 12 },
                }}
              />
            )}
            <DefaultButton
              iconProps={{ iconName: "Refresh" }}
              text="Refresh"
              onClick={() => {
                setLogs(generateUserActivityLogs(projectId, 25));
                setCurrentPage(1);
              }}
              styles={{
                root: {
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#323130",
                  fontSize: 14,
                  height: "auto",
                  padding: "10px 8px",
                  marginLeft: "auto",
                },
                icon: { fontSize: 14, color: "#176df3" },
                label: { fontSize: 14, fontWeight: 400 },
              }}
            />
          </div>
        </div>

        <div className={styles.card}>
          {dateRangeType === "custom" && filteredLogs.length === 0 ? (
            <div className={styles.cardInnerPadding}>
              <MessageBar messageBarType={MessageBarType.info} isMultiline={false}>
                No activity in the selected date range.
              </MessageBar>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className={styles.cardInnerPadding}>
              <MessageBar messageBarType={MessageBarType.info} isMultiline={false}>
                No activity to show.
              </MessageBar>
            </div>
          ) : (
            <DetailsList
              items={paginatedLogs}
              columns={columns}
              selectionMode={SelectionMode.none}
              layoutMode={DetailsListLayoutMode.fixedColumns}
              isHeaderVisible={true}
              onRenderRow={onRenderRow}
              onShouldVirtualize={() => false}
              styles={detailsListStyles as any}
            />
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <IconButton
              iconProps={{ iconName: "DoubleChevronLeft" }}
              title="First page"
              ariaLabel="First page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: { backgroundColor: "transparent", color: "#C8C6C4" },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <IconButton
              iconProps={{ iconName: "ChevronLeft" }}
              title="Previous page"
              ariaLabel="Previous page"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: { backgroundColor: "transparent", color: "#C8C6C4" },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <div className={styles.paginationPages}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === currentPage
                        ? `${styles.paginationPageBtn} ${styles.paginationCurrent}`
                        : styles.paginationPageBtn
                    }
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === currentPage ? "page" : undefined}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <IconButton
              iconProps={{ iconName: "ChevronRight" }}
              title="Next page"
              ariaLabel="Next page"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: { backgroundColor: "transparent", color: "#C8C6C4" },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
            <IconButton
              iconProps={{ iconName: "DoubleChevronRight" }}
              title="Last page"
              ariaLabel="Last page"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              styles={{
                root: { width: 24, height: 24, color: "#176df3" },
                rootDisabled: { backgroundColor: "transparent", color: "#C8C6C4" },
                icon: { fontSize: 14, fontWeight: 600, color: "#176df3" },
                iconDisabled: { color: "#C8C6C4" },
              }}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isDateModalOpen}
        onDismiss={() => {
          setIsDateModalOpen(false);
          setShowStartCalendar(false);
          setShowEndCalendar(false);
        }}
        isBlocking={false}
        styles={{ main: { maxWidth: 400, width: "90%" } }}
      >
        <div style={{ padding: 24 }}>
          <Text
            styles={{
              root: {
                fontSize: 18,
                fontWeight: 600,
                color: "#323130",
                marginBottom: 20,
              },
            }}
          >
            Custom Date Range
          </Text>
          <Stack tokens={{ childrenGap: 20 }}>
            <div>
              <Text
                styles={{
                  root: {
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#323130",
                    marginBottom: 8,
                    display: "block",
                  },
                }}
              >
                Start Date
              </Text>
              <div ref={startDateInputRef} style={{ position: "relative" }}>
                <TextField
                  readOnly
                  value={
                    tempStartDate
                      ? tempStartDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""
                  }
                  placeholder="Select start date"
                  onClick={() => {
                    setShowStartCalendar(!showStartCalendar);
                    setShowEndCalendar(false);
                  }}
                  styles={{
                    root: { width: "100%" },
                    field: { cursor: "pointer" },
                  }}
                  onRenderSuffix={() => (
                    <Icon
                      iconName="Calendar"
                      styles={{
                        root: {
                          fontSize: 16,
                          color: "#605e5c",
                          cursor: "pointer",
                        },
                      }}
                      onClick={() => {
                        setShowStartCalendar(!showStartCalendar);
                        setShowEndCalendar(false);
                      }}
                    />
                  )}
                />
              </div>
              {showStartCalendar && startDateInputRef.current && (
                <div
                  data-calendar-container
                  style={{
                    position: "fixed",
                    top:
                      startDateInputRef.current.getBoundingClientRect().bottom +
                      4,
                    left: startDateInputRef.current.getBoundingClientRect().left,
                    zIndex: 10000,
                    backgroundColor: "#ffffff",
                    border: "1px solid #edebe9",
                    borderRadius: 4,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  <Calendar
                    value={tempStartDate || undefined}
                    onSelectDate={(date) => {
                      setTempStartDate(date);
                      setShowStartCalendar(false);
                    }}
                    styles={{
                      root: { padding: 12, width: "100%" },
                      monthPickerWrapper: { paddingRight: 8 },
                      divider: { marginLeft: 8, marginRight: 8 },
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <Text
                styles={{
                  root: {
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#323130",
                    marginBottom: 8,
                    display: "block",
                  },
                }}
              >
                End Date
              </Text>
              <div ref={endDateInputRef} style={{ position: "relative" }}>
                <TextField
                  readOnly
                  value={
                    tempEndDate
                      ? tempEndDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""
                  }
                  placeholder="Select end date"
                  onClick={() => {
                    setShowEndCalendar(!showEndCalendar);
                    setShowStartCalendar(false);
                  }}
                  styles={{
                    root: { width: "100%" },
                    field: { cursor: "pointer" },
                  }}
                  onRenderSuffix={() => (
                    <Icon
                      iconName="Calendar"
                      styles={{
                        root: {
                          fontSize: 16,
                          color: "#605e5c",
                          cursor: "pointer",
                        },
                      }}
                      onClick={() => {
                        setShowEndCalendar(!showEndCalendar);
                        setShowStartCalendar(false);
                      }}
                    />
                  )}
                />
              </div>
              {showEndCalendar && endDateInputRef.current && (
                <div
                  data-calendar-container
                  style={{
                    position: "fixed",
                    top:
                      endDateInputRef.current.getBoundingClientRect().bottom + 4,
                    left: endDateInputRef.current.getBoundingClientRect().left,
                    zIndex: 10000,
                    backgroundColor: "#ffffff",
                    border: "1px solid #edebe9",
                    borderRadius: 4,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  <Calendar
                    value={tempEndDate || undefined}
                    onSelectDate={(date) => {
                      setTempEndDate(date);
                      setShowEndCalendar(false);
                    }}
                    styles={{
                      root: { padding: 12, width: "100%" },
                      monthPickerWrapper: { paddingRight: 8 },
                      divider: { marginLeft: 8, marginRight: 8 },
                    }}
                  />
                </div>
              )}
            </div>
            <Stack
              horizontal
              tokens={{ childrenGap: 12 }}
              styles={{ root: { justifyContent: "flex-end", marginTop: 8 } }}
            >
              <DefaultButton
                text="Cancel"
                onClick={() => {
                  setIsDateModalOpen(false);
                  setShowStartCalendar(false);
                  setShowEndCalendar(false);
                  setTempStartDate(startDate);
                  setTempEndDate(endDate);
                }}
                styles={{ root: { borderColor: "#edebe9", color: "#323130" } }}
              />
              <PrimaryButton
                text="Done"
                onClick={() => {
                  setStartDate(tempStartDate);
                  setEndDate(tempEndDate);
                  setCurrentPage(1);
                  setIsDateModalOpen(false);
                  setShowStartCalendar(false);
                  setShowEndCalendar(false);
                }}
                styles={{
                  root: { backgroundColor: "#176df3", borderColor: "#176df3" },
                }}
              />
            </Stack>
          </Stack>
        </div>
      </Modal>

      <Modal
        isOpen={showExportCsvModal}
        onDismiss={() => setShowExportCsvModal(false)}
        isBlocking={false}
        styles={{ main: { maxWidth: 440, width: "90%", borderRadius: 4 } }}
      >
        <div style={{ padding: "24px 24px 20px" }}>
          <Text
            block
            styles={{
              root: {
                fontSize: 20,
                fontWeight: 600,
                color: "#323130",
                marginBottom: 16,
              },
            }}
          >
            Export CSV
          </Text>
          <Text
            block
            styles={{
              root: {
                fontSize: 14,
                color: "#605e5c",
                lineHeight: 22,
                marginBottom: 28,
              },
            }}
          >
            Are you sure you want to export the audit log from{" "}
            <span style={{ fontWeight: 600, color: "#323130" }}>{exportDateRangeText}</span>
            {" "}as a CSV file?
            This may take a moment depending on the amount of data.
          </Text>
          <Stack
            horizontal
            tokens={{ childrenGap: 12 }}
            styles={{ root: { justifyContent: "flex-end", flexWrap: "nowrap" } }}
          >
            <PrimaryButton
              text="Export"
              onClick={() => runExportCsv()}
              styles={{
                root: {
                  backgroundColor: "#176df3",
                  borderColor: "#176df3",
                  minWidth: 76,
                },
              }}
            />
            <DefaultButton
              text="Cancel"
              onClick={() => setShowExportCsvModal(false)}
              styles={{
                root: {
                  borderColor: "#8a8886",
                  color: "#323130",
                  minWidth: 76,
                },
              }}
            />
          </Stack>
        </div>
      </Modal>
    </div>
  );
};

export default AuditLogContent;
