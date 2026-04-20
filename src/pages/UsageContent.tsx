import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Icon,
  Dropdown,
  IDropdownOption,
  Callout,
  TooltipHost,
  IconButton,
  DirectionalHint,
  Modal,
  Stack,
  TextField,
  Calendar,
  Text,
  DefaultButton,
  PrimaryButton,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { getAppMessagingUsage, getAppMonthlyActiveUsers } from "../api/siteadmin";
import type { MessagingUsage, MonthlyActiveUsersCount } from "../api/types";
import styles from "./UsageContent.module.css";

const SMS_DATE_RANGE_OPTIONS: IDropdownOption[] = [
  { key: "last7", text: "Last 7 days" },
  { key: "last30", text: "Last 30 days" },
  { key: "last60", text: "Last 60 days" },
  { key: "last90", text: "Last 90 days" },
  { key: "last180", text: "Last 180 days" },
  { key: "custom", text: "Custom date range" },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SMS_RANGE_DAYS: Record<string, number> = {
  last7: 7,
  last30: 30,
  last60: 60,
  last90: 90,
  last180: 180,
};

/** Convert a range key + optional custom dates to YYYY-MM-DD start/end strings for the API */
function getEffectiveDateRange(
  rangeKey: string,
  customStart?: Date | null,
  customEnd?: Date | null
): { start: string; end: string } {
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  if (rangeKey === "custom" && customStart && customEnd) {
    return { start: toDateStr(customStart), end: toDateStr(customEnd) };
  }
  const days = SMS_RANGE_DAYS[rangeKey] ?? 7;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { start: toDateStr(start), end: toDateStr(now) };
}

function getSmsDateRangeLabel(
  rangeKey: string,
  customStart?: Date | null,
  customEnd?: Date | null
): string {
  const now = new Date();
  if (rangeKey === "custom") {
    if (customStart && customEnd) return `${formatShortDate(customStart)} - ${formatShortDate(customEnd)}`;
    if (customStart) return `from ${formatShortDate(customStart)}`;
    if (customEnd) return `until ${formatShortDate(customEnd)}`;
    return "Select start and end date";
  }
  const days = SMS_RANGE_DAYS[rangeKey];
  if (!days) return "";
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const MAU_CAP = 25000;

/** True if monthKey is after the current calendar month (no data for future months) */
function isMonthKeyInFuture(monthKey: string): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1–12
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return false;
  return y > currentYear || (y === currentYear && m > currentMonth);
}


interface UsageContentProps {
  appId: string;
}

const UsageContent: React.VFC<UsageContentProps> = ({ appId }) => {
  const [smsDateRangeKey, setSmsDateRangeKey] = useState<string>("last7");
  const [smsCustomStartDate, setSmsCustomStartDate] = useState<Date | null>(null);
  const [smsCustomEndDate, setSmsCustomEndDate] = useState<Date | null>(null);
  const [showSmsDateModal, setShowSmsDateModal] = useState(false);
  const [tempSmsStartDate, setTempSmsStartDate] = useState<Date | null>(null);
  const [tempSmsEndDate, setTempSmsEndDate] = useState<Date | null>(null);
  const [showSmsStartCalendar, setShowSmsStartCalendar] = useState(false);
  const [showSmsEndCalendar, setShowSmsEndCalendar] = useState(false);
  const smsStartDateInputRef = useRef<HTMLDivElement>(null);
  const smsEndDateInputRef = useRef<HTMLDivElement>(null);

  const [mauMonthKey, setMauMonthKey] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const mauMonthTriggerRef = useRef<HTMLDivElement>(null);
  const [mauMonthTargetRect, setMauMonthTargetRect] = useState<DOMRect | null>(null);

  const [mauOverviewYear, setMauOverviewYear] = useState(() => new Date().getFullYear());
  const [showOverviewYearPicker, setShowOverviewYearPicker] = useState(false);
  const mauOverviewYearTriggerRef = useRef<HTMLDivElement>(null);
  const [mauOverviewYearTargetRect, setMauOverviewYearTargetRect] = useState<DOMRect | null>(null);

  // API state: messaging usage
  const [messagingUsage, setMessagingUsage] = useState<MessagingUsage | null>(null);
  const [messagingLoading, setMessagingLoading] = useState(false);

  // API state: MAU single-month card
  const [mauCardCount, setMauCardCount] = useState<number | null>(null);
  const [mauCardLoading, setMauCardLoading] = useState(false);

  // API state: MAU annual chart
  const [mauChartCounts, setMauChartCounts] = useState<MonthlyActiveUsersCount[]>([]);
  const [mauChartLoading, setMauChartLoading] = useState(false);

  useEffect(() => {
    if (showSmsDateModal) {
      setTempSmsStartDate(smsCustomStartDate);
      setTempSmsEndDate(smsCustomEndDate);
    }
  }, [showSmsDateModal, smsCustomStartDate, smsCustomEndDate]);

  // Fetch messaging usage whenever date range changes
  const fetchMessaging = useCallback(() => {
    if (smsDateRangeKey === "custom" && (!smsCustomStartDate || !smsCustomEndDate)) return;
    const { start, end } = getEffectiveDateRange(smsDateRangeKey, smsCustomStartDate, smsCustomEndDate);
    setMessagingLoading(true);
    setMessagingUsage(null);
    getAppMessagingUsage(appId, start, end)
      .then(setMessagingUsage)
      .catch(() => setMessagingUsage(null))
      .finally(() => setMessagingLoading(false));
  }, [appId, smsDateRangeKey, smsCustomStartDate, smsCustomEndDate]);

  useEffect(() => {
    fetchMessaging();
  }, [fetchMessaging]);

  // Fetch MAU for selected month
  useEffect(() => {
    const [y, m] = mauMonthKey.split("-").map(Number);
    if (!y || !m) return;
    setMauCardLoading(true);
    setMauCardCount(null);
    getAppMonthlyActiveUsers(appId, y, m, y, m)
      .then((res) => setMauCardCount(res.counts[0]?.count ?? 0))
      .catch(() => setMauCardCount(null))
      .finally(() => setMauCardLoading(false));
  }, [appId, mauMonthKey]);

  // Fetch MAU chart for selected year
  useEffect(() => {
    setMauChartLoading(true);
    setMauChartCounts([]);
    getAppMonthlyActiveUsers(appId, mauOverviewYear, 1, mauOverviewYear, 12)
      .then((res) => setMauChartCounts(res.counts))
      .catch(() => setMauChartCounts([]))
      .finally(() => setMauChartLoading(false));
  }, [appId, mauOverviewYear]);

  const smsDateRangeText = useMemo(
    () => getSmsDateRangeLabel(smsDateRangeKey, smsCustomStartDate, smsCustomEndDate),
    [smsDateRangeKey, smsCustomStartDate, smsCustomEndDate]
  );

  // Derive SMS rows from API response
  const smsCostRows = useMemo(() => {
    if (!messagingUsage) return null;
    return [
      { label: "SMS (US/Canada)", count: messagingUsage.sms_north_america_count },
      { label: "SMS (Other)", count: messagingUsage.sms_other_regions_count },
      { label: "WhatsApp (US/Canada)", count: messagingUsage.whatsapp_north_america_count },
      { label: "WhatsApp (Other)", count: messagingUsage.whatsapp_other_regions_count },
    ];
  }, [messagingUsage]);

  const mauMonthLabel = useMemo(() => {
    const [y, m] = mauMonthKey.split("-").map(Number);
    if (!y || !m) return "Nov 2025";
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }, [mauMonthKey]);
  const mauYear = useMemo(() => parseInt(mauMonthKey.split("-")[0] ?? "2025", 10), [mauMonthKey]);
  const mauMonthIndex = useMemo(() => parseInt(mauMonthKey.split("-")[1] ?? "1", 10) - 1, [mauMonthKey]);

  const isMauMonthFuture = useMemo(() => {
    const now = new Date();
    const [y, m] = mauMonthKey.split("-").map(Number);
    if (!y || !m) return false;
    return y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1);
  }, [mauMonthKey]);

  const mauCurrentCount = isMauMonthFuture ? 0 : (mauCardCount ?? 0);
  const mauPercent = isMauMonthFuture ? 0 : Math.min(100, (mauCurrentCount / MAU_CAP) * 100);

  // Derive chart rows from API response
  const mauMonthlyOverview = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthKey = `${mauOverviewYear}-${String(month).padStart(2, "0")}`;
      const found = mauChartCounts.find((c) => c.year === mauOverviewYear && c.month === month);
      const mau = isMonthKeyInFuture(monthKey) ? 0 : (found?.count ?? 0);
      return { monthKey, label: `${MONTH_NAMES[i]} ${mauOverviewYear}`, mau };
    });
  }, [mauChartCounts, mauOverviewYear]);

  const mauOverviewMax = useMemo(
    () => Math.max(1, ...mauMonthlyOverview.map((r) => r.mau)),
    [mauMonthlyOverview]
  );

  useEffect(() => {
    if (showMonthPicker) setPickerYear(mauYear);
  }, [showMonthPicker, mauYear]);

  const goToToday = () => {
    const now = new Date();
    setMauMonthKey(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setPickerYear(now.getFullYear());
    setShowMonthPicker(false);
  };

  const selectMonth = (monthIndex: number) => {
    setMauMonthKey(`${pickerYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setShowMonthPicker(false);
  };

  return (
    <div className={styles.root}>
      {/* SMS/WhatsApp Cost (Estimated) */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>SMS/WhatsApp Cost (Estimated)</h3>
          <div className={styles.cardHeaderControl}>
            <Dropdown
              options={SMS_DATE_RANGE_OPTIONS}
              selectedKey={smsDateRangeKey}
              onChange={(_, opt) => {
                if (opt) {
                  setSmsDateRangeKey(opt.key as string);
                  if (opt.key === "custom") setShowSmsDateModal(true);
                }
              }}
              styles={{
                root: { minWidth: 160 },
                title: {
                  borderColor: "#edebe9",
                  fontSize: 14,
                  color: "#323130",
                },
                caretDown: { color: "#605e5c" },
                dropdownItem: { fontSize: 14 },
              }}
            />
          </div>
        </div>
        <div
          className={smsDateRangeKey === "custom" ? styles.smsDateRangeRowClickable : undefined}
          role={smsDateRangeKey === "custom" ? "button" : undefined}
          tabIndex={smsDateRangeKey === "custom" ? 0 : undefined}
          onClick={
            smsDateRangeKey === "custom"
              ? () => setShowSmsDateModal(true)
              : undefined
          }
          onKeyDown={
            smsDateRangeKey === "custom"
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowSmsDateModal(true);
                  }
                }
              : undefined
          }
        >
          <p className={styles.smsDateRangeText}>
            {smsDateRangeText}
            {smsDateRangeKey === "custom" && (
              <Icon
                iconName="Calendar"
                className={styles.smsDateRangeCalendarIcon}
                aria-hidden
              />
            )}
          </p>
        </div>
        <div className={styles.smsDivider} aria-hidden />
        {messagingLoading ? (
          <div style={{ padding: "8px 0" }}>
            <Spinner size={SpinnerSize.small} />
          </div>
        ) : smsCostRows ? (
          smsCostRows.map((row) => (
            <div key={row.label} className={styles.smsRow}>
              <span className={styles.smsLabel}>{row.label}</span>
              <span className={styles.smsValue}>{row.count.toLocaleString()} messages</span>
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13, color: "#797775", margin: "8px 0" }}>No data available.</p>
        )}
      </div>

      {/* Monthly Active Users — single month + chart */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Monthly Active Users</h3>
        </div>
        <div className={styles.mauCurrentMonthRow}>
          <span className={styles.mauCurrentMonthLabel}>Month</span>
          <div
            ref={mauMonthTriggerRef}
            className={styles.mauMonthWrap}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={showMonthPicker}
            aria-label={`Month: ${mauMonthLabel}. Click to choose month.`}
            onClick={() => {
              if (!showMonthPicker && mauMonthTriggerRef.current) {
                setMauMonthTargetRect(mauMonthTriggerRef.current.getBoundingClientRect());
              }
              setShowMonthPicker((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!showMonthPicker && mauMonthTriggerRef.current) {
                  setMauMonthTargetRect(mauMonthTriggerRef.current.getBoundingClientRect());
                }
                setShowMonthPicker((v) => !v);
              }
            }}
          >
            <span className={styles.mauMonthTriggerText}>{mauMonthLabel}</span>
            <Icon iconName="Calendar" className={styles.mauMonthTriggerIcon} />
          </div>
        </div>
        {showMonthPicker && (mauMonthTargetRect ?? mauMonthTriggerRef.current) && (
          <Callout
            target={mauMonthTargetRect ?? mauMonthTriggerRef.current!}
            onDismiss={() => {
              setShowMonthPicker(false);
              setMauMonthTargetRect(null);
            }}
            directionalHint={DirectionalHint.bottomRightEdge}
            directionalHintFixed
            isBeakVisible={false}
            gapSpace={4}
            className={styles.mauMonthCallout}
          >
            <div className={styles.mauMonthPanel}>
              <div className={styles.mauMonthPanelYearRow}>
                <span className={styles.mauMonthPanelYear}>{pickerYear}</span>
                <div className={styles.mauMonthPanelYearArrows}>
                  <IconButton
                    iconProps={{ iconName: "ChevronUp" }}
                    ariaLabel="Previous year"
                    onClick={() => setPickerYear((y) => y - 1)}
                    styles={{
                      root: { width: 24, height: 24 },
                      icon: { fontSize: 12, color: "#323130" },
                    }}
                  />
                  <IconButton
                    iconProps={{ iconName: "ChevronDown" }}
                    ariaLabel="Next year"
                    onClick={() => setPickerYear((y) => y + 1)}
                    styles={{
                      root: { width: 24, height: 24 },
                      icon: { fontSize: 12, color: "#323130" },
                    }}
                  />
                </div>
              </div>
              <div className={styles.mauMonthGrid} role="grid" aria-label="Months">
                {MONTH_NAMES.map((name, idx) => (
                  <button
                    key={name}
                    type="button"
                    role="gridcell"
                    className={
                      pickerYear === mauYear && idx === mauMonthIndex
                        ? `${styles.mauMonthCell} ${styles.mauMonthCellSelected}`
                        : styles.mauMonthCell
                    }
                    onClick={() => selectMonth(idx)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className={styles.mauMonthGoToTodayWrap}>
                <button
                  type="button"
                  className={styles.mauMonthGoToToday}
                  onClick={goToToday}
                >
                  Go to today
                </button>
              </div>
            </div>
          </Callout>
        )}
        <div className={styles.mauProgressValueRow}>
          <span className={styles.mauProgressValue}>
            {mauCardLoading
              ? "—"
              : isMauMonthFuture
                ? "—"
                : `${mauCurrentCount.toLocaleString()} / ${MAU_CAP.toLocaleString()}`}
          </span>
        </div>
        <TooltipHost
          content={
            isMauMonthFuture || mauCardLoading
              ? "No data"
              : `Monthly active users: ${mauCurrentCount.toLocaleString()} of ${MAU_CAP.toLocaleString()}`
          }
          directionalHint={DirectionalHint.topCenter}
          delay={0}
          hostClassName={styles.mauProgressBarTooltipHost}
          tooltipProps={{
            calloutProps: {
              gapSpace: 8,
              isBeakVisible: true,
            },
          }}
        >
          <div className={styles.mauProgressBar} role="progressbar" aria-valuenow={mauCurrentCount} aria-valuemin={0} aria-valuemax={MAU_CAP} aria-label={`Monthly active users: ${mauCurrentCount.toLocaleString()} of ${MAU_CAP.toLocaleString()}`}>
            <div className={styles.mauProgressTrack}>
              <div
                className={styles.mauProgressFill}
                style={{ width: `${Math.min(100, mauPercent)}%` }}
              />
            </div>
          </div>
        </TooltipHost>

        <div className={styles.mauCardDivider} aria-hidden />

        <div className={styles.mauOverviewHeader}>
          <h3 className={styles.mauOverviewTitle}>Year</h3>
          <div
            ref={mauOverviewYearTriggerRef}
            className={styles.mauMonthWrap}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={showOverviewYearPicker}
            aria-label={`Year: ${mauOverviewYear}. Click to choose year.`}
            onClick={() => {
              if (!showOverviewYearPicker && mauOverviewYearTriggerRef.current) {
                setMauOverviewYearTargetRect(mauOverviewYearTriggerRef.current.getBoundingClientRect());
              }
              setShowOverviewYearPicker((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!showOverviewYearPicker && mauOverviewYearTriggerRef.current) {
                  setMauOverviewYearTargetRect(mauOverviewYearTriggerRef.current.getBoundingClientRect());
                }
                setShowOverviewYearPicker((v) => !v);
              }
            }}
          >
            <span className={styles.mauMonthTriggerText}>{mauOverviewYear}</span>
            <Icon iconName="Calendar" className={styles.mauMonthTriggerIcon} />
          </div>
        </div>
        {showOverviewYearPicker && (mauOverviewYearTargetRect ?? mauOverviewYearTriggerRef.current) && (
          <Callout
            target={mauOverviewYearTargetRect ?? mauOverviewYearTriggerRef.current!}
            onDismiss={() => {
              setShowOverviewYearPicker(false);
              setMauOverviewYearTargetRect(null);
            }}
            directionalHint={DirectionalHint.bottomRightEdge}
            directionalHintFixed
            isBeakVisible={false}
            gapSpace={4}
            className={styles.mauMonthCallout}
          >
            <div className={styles.mauMonthPanel}>
              <div className={styles.mauMonthPanelYearRow}>
                <span className={styles.mauMonthPanelYear}>{mauOverviewYear}</span>
                <div className={styles.mauMonthPanelYearArrows}>
                  <IconButton
                    iconProps={{ iconName: "ChevronUp" }}
                    ariaLabel="Previous year"
                    onClick={() => setMauOverviewYear((y) => y - 1)}
                    styles={{
                      root: { width: 24, height: 24 },
                      icon: { fontSize: 12, color: "#323130" },
                    }}
                  />
                  <IconButton
                    iconProps={{ iconName: "ChevronDown" }}
                    ariaLabel="Next year"
                    onClick={() => setMauOverviewYear((y) => y + 1)}
                    styles={{
                      root: { width: 24, height: 24 },
                      icon: { fontSize: 12, color: "#323130" },
                    }}
                  />
                </div>
              </div>
              <div className={styles.mauMonthGoToTodayWrap}>
                <button
                  type="button"
                  className={styles.mauMonthGoToToday}
                  onClick={() => {
                    setMauOverviewYear(new Date().getFullYear());
                    setShowOverviewYearPicker(false);
                  }}
                >
                  Go to current year
                </button>
              </div>
            </div>
          </Callout>
        )}
        {mauChartLoading && (
          <div style={{ padding: "8px 0" }}>
            <Spinner size={SpinnerSize.small} />
          </div>
        )}
        <div className={styles.mauOverviewChart} role="img" aria-label={`Monthly Active Users for ${mauOverviewYear}`}>
          <div className={styles.mauOverviewChartArea}>
            <div className={styles.mauOverviewBars}>
            {mauMonthlyOverview.map(({ monthKey, label, mau }) => {
              const pct = mauOverviewMax > 0 ? (mau / mauOverviewMax) * 100 : 0;
              const hasData = mau > 0;
              const monthOnly = label.split(" ")[0] ?? label;
              const tooltipContent = isMonthKeyInFuture(monthKey)
                ? `${label}: No data`
                : `${label}: ${mau.toLocaleString()} MAUs`;
              const fillClass = !hasData ? styles.mauOverviewBarFillEmpty : styles.mauOverviewBarFill;
              const barHeightPx = 140;
              const fillHeightPx = hasData ? (pct / 100) * barHeightPx : 0;
              return (
                <div key={monthKey} className={styles.mauOverviewBarWrap}>
                  <div
                    className={styles.mauOverviewBarTrack}
                    role="img"
                    aria-label={tooltipContent}
                  >
                    <TooltipHost
                      content={tooltipContent}
                      directionalHint={DirectionalHint.topCenter}
                      delay={0}
                      hostClassName={styles.mauOverviewBarTooltipHost}
                      tooltipProps={{
                        calloutProps: {
                          gapSpace: 2,
                          isBeakVisible: true,
                        },
                      }}
                    >
                      <div
                        className={fillClass}
                        style={{
                          height: hasData ? `${fillHeightPx}px` : "0",
                          minHeight: 0,
                        }}
                      />
                    </TooltipHost>
                  </div>
                  <span className={styles.mauOverviewBarLabel}>{monthOnly}</span>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>

      {/* SMS/WhatsApp Cost — Custom date range modal */}
      <Modal
        isOpen={showSmsDateModal}
        onDismiss={() => {
          setShowSmsDateModal(false);
          setShowSmsStartCalendar(false);
          setShowSmsEndCalendar(false);
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
              <div ref={smsStartDateInputRef} style={{ position: "relative" }}>
                <TextField
                  readOnly
                  value={
                    tempSmsStartDate
                      ? tempSmsStartDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""
                  }
                  placeholder="Select start date"
                  onClick={() => {
                    setShowSmsStartCalendar(!showSmsStartCalendar);
                    setShowSmsEndCalendar(false);
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
                        setShowSmsStartCalendar(!showSmsStartCalendar);
                        setShowSmsEndCalendar(false);
                      }}
                    />
                  )}
                />
              </div>
              {showSmsStartCalendar && smsStartDateInputRef.current && (
                <div
                  data-calendar-container
                  style={{
                    position: "fixed",
                    top:
                      smsStartDateInputRef.current.getBoundingClientRect().bottom + 4,
                    left: smsStartDateInputRef.current.getBoundingClientRect().left,
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
                    value={tempSmsStartDate || undefined}
                    onSelectDate={(date) => {
                      setTempSmsStartDate(date);
                      setShowSmsStartCalendar(false);
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
              <div ref={smsEndDateInputRef} style={{ position: "relative" }}>
                <TextField
                  readOnly
                  value={
                    tempSmsEndDate
                      ? tempSmsEndDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""
                  }
                  placeholder="Select end date"
                  onClick={() => {
                    setShowSmsEndCalendar(!showSmsEndCalendar);
                    setShowSmsStartCalendar(false);
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
                        setShowSmsEndCalendar(!showSmsEndCalendar);
                        setShowSmsStartCalendar(false);
                      }}
                    />
                  )}
                />
              </div>
              {showSmsEndCalendar && smsEndDateInputRef.current && (
                <div
                  data-calendar-container
                  style={{
                    position: "fixed",
                    top:
                      smsEndDateInputRef.current.getBoundingClientRect().bottom + 4,
                    left: smsEndDateInputRef.current.getBoundingClientRect().left,
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
                    value={tempSmsEndDate || undefined}
                    onSelectDate={(date) => {
                      setTempSmsEndDate(date);
                      setShowSmsEndCalendar(false);
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
                  setShowSmsDateModal(false);
                  setShowSmsStartCalendar(false);
                  setShowSmsEndCalendar(false);
                  setTempSmsStartDate(smsCustomStartDate);
                  setTempSmsEndDate(smsCustomEndDate);
                }}
                styles={{ root: { borderColor: "#edebe9", color: "#323130" } }}
              />
              <PrimaryButton
                text="Done"
                onClick={() => {
                  setSmsCustomStartDate(tempSmsStartDate);
                  setSmsCustomEndDate(tempSmsEndDate);
                  setShowSmsDateModal(false);
                  setShowSmsStartCalendar(false);
                  setShowSmsEndCalendar(false);
                }}
                styles={{
                  root: { backgroundColor: "#176df3", borderColor: "#176df3" },
                }}
              />
            </Stack>
          </Stack>
        </div>
      </Modal>
    </div>
  );
};

export default UsageContent;
