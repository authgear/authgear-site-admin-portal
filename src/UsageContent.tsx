import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Icon,
  Dropdown,
  IDropdownOption,
  ProgressIndicator,
  Callout,
  IconButton,
  DirectionalHint,
  Modal,
  Stack,
  TextField,
  Calendar,
  Text,
  DefaultButton,
  PrimaryButton,
} from "@fluentui/react";
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

/** Sample SMS/WhatsApp message counts for the selected date range */
function getSmsCostData(
  rangeKey: string,
  customStart?: Date | null,
  customEnd?: Date | null
): { label: string; count: number }[] {
  if (rangeKey === "last7") {
    return [
      { label: "SMS (US/Canada)", count: 23 },
      { label: "SMS (Other)", count: 18 },
      { label: "WhatsApp (US/Canada)", count: 71 },
      { label: "WhatsApp (Other)", count: 123 },
    ];
  }
  let seed = 2;
  if (rangeKey === "custom" && customStart && customEnd) {
    const days = Math.ceil((customEnd.getTime() - customStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    seed = Math.min(5, Math.max(2, Math.floor(days / 30)));
  } else if (SMS_RANGE_DAYS[rangeKey]) {
    seed = Math.min(5, Math.max(2, Math.floor(SMS_RANGE_DAYS[rangeKey] / 30)));
  }
  return [
    { label: "SMS (US/Canada)", count: 20 + seed * 4 },
    { label: "SMS (Other)", count: 15 + seed * 4 },
    { label: "WhatsApp (US/Canada)", count: 65 + seed * 8 },
    { label: "WhatsApp (Other)", count: 110 + seed * 15 },
  ];
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

const MAU_CAP = 25000;

/** MAU count for a single month (YYYY-MM) — deterministic by month key */
function getMauCountForMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return 23173;
  const seed = y * 12 + m;
  return 18000 + (seed % 8000);
}

/** Previous calendar month key (e.g. 2026-02 → 2026-01, 2026-01 → 2025-12) */
function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** MAU data for the selected month: current = that month, lastMonth = previous month's MAU */
function getMauDataForMonth(monthKey: string): { current: number; lastMonth: number } {
  const current = getMauCountForMonth(monthKey);
  const lastMonth = getMauCountForMonth(previousMonthKey(monthKey));
  return { current, lastMonth };
}

const UsageContent: React.VFC = () => {
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

  useEffect(() => {
    if (showSmsDateModal) {
      setTempSmsStartDate(smsCustomStartDate);
      setTempSmsEndDate(smsCustomEndDate);
    }
  }, [showSmsDateModal, smsCustomStartDate, smsCustomEndDate]);

  const smsDateRangeText = useMemo(
    () => getSmsDateRangeLabel(smsDateRangeKey, smsCustomStartDate, smsCustomEndDate),
    [smsDateRangeKey, smsCustomStartDate, smsCustomEndDate]
  );
  const smsCostRows = useMemo(
    () => getSmsCostData(smsDateRangeKey, smsCustomStartDate, smsCustomEndDate),
    [smsDateRangeKey, smsCustomStartDate, smsCustomEndDate]
  );
  const mauMonthLabel = useMemo(() => {
    const [y, m] = mauMonthKey.split("-").map(Number);
    if (!y || !m) return "Nov 2025";
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }, [mauMonthKey]);
  const mauYear = useMemo(() => parseInt(mauMonthKey.split("-")[0] ?? "2025", 10), [mauMonthKey]);
  const mauMonthIndex = useMemo(() => parseInt(mauMonthKey.split("-")[1] ?? "1", 10) - 1, [mauMonthKey]);

  const mauData = useMemo(() => getMauDataForMonth(mauMonthKey), [mauMonthKey]);

  /** Selected month is after current real date → show empty MAU data */
  const isMauMonthFuture = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [y, m] = mauMonthKey.split("-").map(Number);
    if (!y || !m) return false;
    return y > currentYear || (y === currentYear && m > currentMonth);
  }, [mauMonthKey]);

  const mauPercent = isMauMonthFuture
    ? 0
    : Math.min(100, (mauData.current / MAU_CAP) * 100);

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
      {/* Subscription Fee */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Subscription Fee</h3>
        </div>
        <div className={styles.subscriptionRow}>
          <span className={styles.subscriptionLeft}>—</span>
          <div className={styles.subscriptionRight}>
            <p className={styles.subscriptionInclude}>Include:</p>
            <p className={styles.subscriptionPlan}>Enterprise Plan</p>
          </div>
        </div>
      </div>

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
        {smsCostRows.map((row) => (
          <div key={row.label} className={styles.smsRow}>
            <span className={styles.smsLabel}>{row.label}</span>
            <span className={styles.smsValue}>{row.count} messages</span>
          </div>
        ))}
      </div>

      {/* Monthly Active User */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Monthly Active User</h3>
          <div className={styles.cardHeaderControl}>
            <div
              ref={mauMonthTriggerRef}
              className={styles.mauMonthWrap}
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-expanded={showMonthPicker}
              aria-label={`Month: ${mauMonthLabel}. Click to choose month.`}
              onClick={() => setShowMonthPicker((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowMonthPicker((v) => !v);
                }
              }}
            >
              <span className={styles.mauMonthTriggerText}>{mauMonthLabel}</span>
              <Icon iconName="Calendar" className={styles.mauMonthTriggerIcon} />
            </div>
            {showMonthPicker && mauMonthTriggerRef.current && (
              <Callout
                target={mauMonthTriggerRef.current}
                onDismiss={() => setShowMonthPicker(false)}
                directionalHint={DirectionalHint.bottomLeftEdge}
                isBeakVisible={false}
                gapSpace={4}
                setInitialFocus
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
          </div>
        </div>
        <div className={styles.mauDivider} aria-hidden />
        <div className={styles.mauProgressValueRow}>
          <span className={styles.mauProgressValue}>
            {isMauMonthFuture
              ? "—"
              : `${mauData.current.toLocaleString()} / ${MAU_CAP.toLocaleString()}`}
          </span>
        </div>
        <div className={styles.mauProgressBar}>
          <ProgressIndicator
            percentComplete={mauPercent / 100}
            barHeight={8}
            styles={{
              root: { margin: 0 },
              progressTrack: { backgroundColor: "#edebe9", borderRadius: 4 },
              progressBar: { backgroundColor: "#176df3", borderRadius: 4 },
            }}
          />
        </div>
        <p className={styles.mauLastMonth}>
          Last month: {isMauMonthFuture ? "—" : mauData.lastMonth.toLocaleString()}
        </p>
      </div>

      {/* SMS/WhatsApp Cost — Custom date range modal (like Audit Log) */}
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
