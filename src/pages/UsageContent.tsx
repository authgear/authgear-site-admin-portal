import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Button,
  Dialog,
  IconButton,
  Popover,
  Select,
  Spinner,
  Tooltip,
} from "@radix-ui/themes";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import {
  getAppMessagingUsage,
  getAppMonthlyActiveUsers,
} from "../api/siteadmin";
import type { MessagingUsage, MonthlyActiveUsersCount } from "../api/types";
import MonthlyBarChart from "../components/MonthlyBarChart";
import { DateField } from "../components/v2/DateField/DateField";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
import { SecondaryButton } from "../components/v2/Button/SecondaryButton/SecondaryButton";
import tooltipStyles from "../components/v2/Tooltip/Tooltip.module.css";
import styles from "./UsageContent.module.css";

const SMS_DATE_RANGE_OPTIONS: Array<{ key: string; text: string }> = [
  { key: "last7", text: "Last 7 days" },
  { key: "last30", text: "Last 30 days" },
  { key: "last60", text: "Last 60 days" },
  { key: "mtd", text: "Month-to-date" },
  { key: "lastMonth", text: "Last month" },
  { key: "ytd", text: "Year-to-date" },
  { key: "last12months", text: "Last 12 months" },
  { key: "custom", text: "Custom date range" },
];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SMS_RANGE_DAYS: Record<string, number> = {
  last7: 7,
  last30: 30,
  last60: 60,
};

/** Compute start/end Date bounds for a preset range key (null for custom).
 *  All date arithmetic uses UTC; returned dates are UTC midnight. */
function getSmsRangeBounds(
  rangeKey: string,
  now: Date
): { start: Date; end: Date } | null {
  const days = SMS_RANGE_DAYS[rangeKey];
  if (days) {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    return { start, end: new Date(now) };
  }
  switch (rangeKey) {
    case "mtd":
      return {
        start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        end: new Date(now),
      };
    case "lastMonth":
      return {
        start: new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
        ),
        end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)),
      };
    case "ytd":
      return {
        start: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
        end: new Date(now),
      };
    case "last12months": {
      const start = new Date(now);
      start.setUTCFullYear(start.getUTCFullYear() - 1);
      start.setUTCDate(start.getUTCDate() + 1);
      return { start, end: new Date(now) };
    }
    default:
      return null;
  }
}

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
  const bounds = getSmsRangeBounds(rangeKey, now) ?? {
    start: new Date(now),
    end: new Date(now),
  };
  return { start: toDateStr(bounds.start), end: toDateStr(bounds.end) };
}

/** Returns 12 { start, end } YYYY-MM-DD ranges for each month of the given year. */
function getMonthRangesForYear(year: number): Array<{
  start: string;
  end: string;
  monthKey: string;
  monthIndex: number;
}> {
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const start = new Date(Date.UTC(year, i, 1));
    // Day 0 of next month = last day of current month.
    const end = new Date(Date.UTC(year, i + 1, 0));
    return {
      start: toDateStr(start),
      end: toDateStr(end),
      monthKey: `${year}-${String(month).padStart(2, "0")}`,
      monthIndex: i,
    };
  });
}

function getSmsDateRangeLabel(
  rangeKey: string,
  customStart?: Date | null,
  customEnd?: Date | null
): string {
  const now = new Date();
  if (rangeKey === "custom") {
    if (customStart && customEnd)
      return `${formatShortDate(customStart)} - ${formatShortDate(customEnd)}`;
    if (customStart) return `from ${formatShortDate(customStart)}`;
    if (customEnd) return `until ${formatShortDate(customEnd)}`;
    return "Select start and end date";
  }
  const bounds = getSmsRangeBounds(rangeKey, now);
  if (!bounds) return "";
  return `${formatShortDate(bounds.start)} - ${formatShortDate(bounds.end)}`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const DATE_STR_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** UTC-midnight Date → yyyy-MM-dd (the DateField value format). */
function toDateFieldValue(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

/** yyyy-MM-dd → UTC-midnight Date, or null if empty/invalid. */
function parseDateFieldValue(value: string): Date | null {
  const m = DATE_STR_PATTERN.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

interface YearPickerProps {
  year: number;
  onChange: React.Dispatch<React.SetStateAction<number>>;
  /** Accessible name prefix for the trigger, e.g. "SMS trend year" */
  label: string;
}

/** Year selector: a trigger showing the year, opening a popover with
 *  previous/next year arrows and a "Go to current year" shortcut. */
const YearPicker: React.VFC<YearPickerProps> = ({ year, onChange, label }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <button
          type="button"
          className={styles.yearTrigger}
          aria-label={`${label}: ${year}. Click to choose year.`}
        >
          <span className={styles.yearTriggerText}>{year}</span>
          <CalendarIcon className={styles.yearTriggerIcon} aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Content
        side="bottom"
        align="end"
        sideOffset={4}
        className={styles.yearPopover}
      >
        <div className={styles.yearPanel}>
          <div className={styles.yearPanelRow}>
            <span className={styles.yearPanelText}>{year}</span>
            <div className={styles.yearPanelArrows}>
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                aria-label="Previous year"
                onClick={() => onChange((y) => y - 1)}
              >
                <ChevronUpIcon />
              </IconButton>
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                aria-label="Next year"
                onClick={() => onChange((y) => y + 1)}
              >
                <ChevronDownIcon />
              </IconButton>
            </div>
          </div>
          <div className={styles.yearPanelFooter}>
            <Button
              size="2"
              variant="ghost"
              onClick={() => {
                onChange(new Date().getUTCFullYear());
                setOpen(false);
              }}
            >
              Go to current year
            </Button>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
};

export const MAU_CAP = 25000;

interface UsageContentProps {
  appId: string;
}

const UsageContent: React.VFC<UsageContentProps> = ({ appId }) => {
  const [smsDateRangeKey, setSmsDateRangeKey] = useState<string>("last7");
  const [smsCustomStartDate, setSmsCustomStartDate] = useState<Date | null>(
    null
  );
  const [smsCustomEndDate, setSmsCustomEndDate] = useState<Date | null>(null);
  const [showSmsDateModal, setShowSmsDateModal] = useState(false);
  // Draft values in the custom range dialog, as yyyy-MM-dd strings (UTC dates).
  const [tempSmsStartDate, setTempSmsStartDate] = useState<string>("");
  const [tempSmsEndDate, setTempSmsEndDate] = useState<string>("");

  const mauMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [mauOverviewYear, setMauOverviewYear] = useState(() =>
    new Date().getUTCFullYear()
  );

  const [smsTrendYear, setSmsTrendYear] = useState(() =>
    new Date().getUTCFullYear()
  );

  const [smsTrendCounts, setSmsTrendCounts] = useState<number[]>([]);
  const [smsTrendLoading, setSmsTrendLoading] = useState(false);

  // API state: messaging usage
  const [messagingUsage, setMessagingUsage] = useState<MessagingUsage | null>(
    null
  );
  const [messagingLoading, setMessagingLoading] = useState(false);

  // API state: MAU single-month card
  const [mauCardCount, setMauCardCount] = useState<number | null>(null);
  const [mauCardLoading, setMauCardLoading] = useState(false);

  // API state: MAU annual chart
  const [mauChartCounts, setMauChartCounts] = useState<
    MonthlyActiveUsersCount[]
  >([]);
  const [mauChartLoading, setMauChartLoading] = useState(false);

  useEffect(() => {
    if (showSmsDateModal) {
      setTempSmsStartDate(toDateFieldValue(smsCustomStartDate));
      setTempSmsEndDate(toDateFieldValue(smsCustomEndDate));
    }
  }, [showSmsDateModal, smsCustomStartDate, smsCustomEndDate]);

  // Fetch messaging usage whenever date range changes
  const fetchMessaging = useCallback(() => {
    if (
      smsDateRangeKey === "custom" &&
      (!smsCustomStartDate || !smsCustomEndDate)
    )
      return;
    const { start, end } = getEffectiveDateRange(
      smsDateRangeKey,
      smsCustomStartDate,
      smsCustomEndDate
    );
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

  // Fetch SMS trend for selected year
  useEffect(() => {
    let ignore = false;
    setSmsTrendLoading(true);
    setSmsTrendCounts([]);
    const ranges = getMonthRangesForYear(smsTrendYear);
    const now = new Date();
    // Only fetch up to and including the current month; future months get 0.
    const fetchable = ranges.filter(
      (r) =>
        smsTrendYear < now.getUTCFullYear() ||
        (smsTrendYear === now.getUTCFullYear() &&
          r.monthIndex <= now.getUTCMonth())
    );
    Promise.all(
      fetchable.map((r) =>
        getAppMessagingUsage(appId, r.start, r.end)
          .then((u) => ({
            monthIndex: r.monthIndex,
            count: u.sms_north_america_count + u.sms_other_regions_count,
          }))
          .catch(() => ({ monthIndex: r.monthIndex, count: 0 }))
      )
    )
      .then((results) => {
        if (ignore) return;
        const arr = new Array(12).fill(0);
        for (const { monthIndex, count } of results) arr[monthIndex] = count;
        setSmsTrendCounts(arr);
      })
      .finally(() => {
        if (!ignore) setSmsTrendLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [appId, smsTrendYear]);

  const smsDateRangeText = useMemo(
    () =>
      getSmsDateRangeLabel(
        smsDateRangeKey,
        smsCustomStartDate,
        smsCustomEndDate
      ),
    [smsDateRangeKey, smsCustomStartDate, smsCustomEndDate]
  );

  // Derive SMS rows from API response
  const smsCostRows = useMemo(() => {
    if (!messagingUsage) return null;
    return [
      {
        label: "SMS (US/Canada)",
        count: messagingUsage.sms_north_america_count,
      },
      { label: "SMS (Other)", count: messagingUsage.sms_other_regions_count },
      {
        label: "WhatsApp (US/Canada)",
        count: messagingUsage.whatsapp_north_america_count,
      },
      {
        label: "WhatsApp (Other)",
        count: messagingUsage.whatsapp_other_regions_count,
      },
    ];
  }, [messagingUsage]);

  const mauMonthLabel = useMemo(() => {
    const [y, m] = mauMonthKey.split("-").map(Number);
    if (!y || !m) return "Nov 2025";
    return `${MONTH_NAMES[m - 1]} ${y}`;
  }, [mauMonthKey]);

  const mauCurrentCount = mauCardCount ?? 0;
  const mauPercent = Math.min(100, (mauCurrentCount / MAU_CAP) * 100);

  const smsTrendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${smsTrendYear}-${String(i + 1).padStart(2, "0")}`;
      return { monthKey, value: smsTrendCounts[i] ?? 0 };
    });
  }, [smsTrendCounts, smsTrendYear]);

  // Derive chart rows from API response
  const mauMonthlyOverview = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthKey = `${mauOverviewYear}-${String(month).padStart(2, "0")}`;
      const found = mauChartCounts.find(
        (c) => c.year === mauOverviewYear && c.month === month
      );
      const isFuture = (() => {
        const now = new Date();
        return (
          mauOverviewYear > now.getUTCFullYear() ||
          (mauOverviewYear === now.getUTCFullYear() &&
            month > now.getUTCMonth() + 1)
        );
      })();
      const mau = isFuture ? 0 : (found?.count ?? 0);
      return { monthKey, mau };
    });
  }, [mauChartCounts, mauOverviewYear]);

  const tempStartValid = parseDateFieldValue(tempSmsStartDate) != null;

  return (
    <div className={styles.root}>
      {/* SMS/WhatsApp Cost (Estimated) */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>SMS/WhatsApp</h3>
          <div className={styles.cardHeaderControl}>
            <Select.Root
              value={smsDateRangeKey}
              onValueChange={(key) => {
                setSmsDateRangeKey(key);
                if (key === "custom") setShowSmsDateModal(true);
              }}
            >
              <Select.Trigger
                className={styles.rangeSelectTrigger}
                aria-label="SMS/WhatsApp date range"
              />
              <Select.Content position="popper">
                {SMS_DATE_RANGE_OPTIONS.map((opt) => (
                  <Select.Item key={opt.key} value={opt.key}>
                    {opt.text}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>
        </div>
        {smsDateRangeKey === "custom" ? (
          <button
            type="button"
            className={styles.smsDateRangeButton}
            onClick={() => setShowSmsDateModal(true)}
          >
            <span className={styles.smsDateRangeText}>
              {smsDateRangeText}
              <CalendarIcon
                className={styles.smsDateRangeCalendarIcon}
                aria-hidden
              />
            </span>
          </button>
        ) : (
          <p className={styles.smsDateRangeText}>{smsDateRangeText}</p>
        )}
        <div className={styles.smsDivider} aria-hidden />
        {messagingLoading ? (
          <div className={styles.loading}>
            <Spinner size="2" />
          </div>
        ) : smsCostRows ? (
          smsCostRows.map((row) => (
            <div key={row.label} className={styles.smsRow}>
              <span className={styles.smsLabel}>{row.label}</span>
              <span className={styles.smsValue}>
                {row.count.toLocaleString()} messages
              </span>
            </div>
          ))
        ) : (
          <p className={styles.emptyText}>No data available.</p>
        )}

        <div className={styles.smsTrendDivider} aria-hidden />

        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>SMS trend</h3>
          <YearPicker
            year={smsTrendYear}
            onChange={setSmsTrendYear}
            label="SMS trend year"
          />
        </div>
        {smsTrendLoading ? (
          <div className={styles.loading}>
            <Spinner size="2" />
          </div>
        ) : (
          <MonthlyBarChart
            year={smsTrendYear}
            data={smsTrendData}
            unit="SMS messages"
            ariaLabel={`SMS messages by month for ${smsTrendYear}`}
          />
        )}
      </div>

      {/* Monthly Active Users — single month + chart */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Monthly Active Users</h3>
        </div>
        <div className={styles.mauCurrentMonthRow}>
          <span className={styles.mauCurrentMonthLabel}>This month</span>
          <span className={styles.mauCurrentMonthValue}>{mauMonthLabel}</span>
        </div>
        <div className={styles.mauProgressValueRow}>
          <span className={styles.mauProgressValue}>
            {mauCardLoading
              ? "—"
              : `${mauCurrentCount.toLocaleString()} / ${MAU_CAP.toLocaleString()}`}
          </span>
        </div>
        <Tooltip
          content={
            mauCardLoading
              ? "No data"
              : `Monthly active users: ${mauCurrentCount.toLocaleString()} of ${MAU_CAP.toLocaleString()}`
          }
          side="top"
          delayDuration={0}
          className={tooltipStyles.tooltip}
        >
          <div
            className={styles.mauProgressBar}
            role="progressbar"
            aria-valuenow={mauCurrentCount}
            aria-valuemin={0}
            aria-valuemax={MAU_CAP}
            aria-label={`Monthly active users: ${mauCurrentCount.toLocaleString()} of ${MAU_CAP.toLocaleString()}`}
          >
            <div className={styles.mauProgressTrack}>
              <div
                className={styles.mauProgressFill}
                style={{ width: `${mauPercent}%` }}
              />
            </div>
          </div>
        </Tooltip>

        <div className={styles.mauCardDivider} aria-hidden />

        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Year</h3>
          <YearPicker
            year={mauOverviewYear}
            onChange={setMauOverviewYear}
            label="Year"
          />
        </div>
        {mauChartLoading && (
          <div className={styles.loading}>
            <Spinner size="2" />
          </div>
        )}
        <MonthlyBarChart
          year={mauOverviewYear}
          data={mauMonthlyOverview.map(({ monthKey, mau }) => ({
            monthKey,
            value: mau,
          }))}
          unit="MAUs"
          ariaLabel={`Monthly Active Users for ${mauOverviewYear}`}
        />
      </div>

      {/* SMS/WhatsApp Cost — Custom date range dialog */}
      <Dialog.Root open={showSmsDateModal} onOpenChange={setShowSmsDateModal}>
        <Dialog.Content maxWidth="400px" aria-describedby={undefined}>
          <Dialog.Title size="4">Custom Date Range</Dialog.Title>
          <div className={styles.dateDialogFields}>
            <DateField
              label="Start Date"
              ariaLabel="Start date"
              value={tempSmsStartDate}
              onChange={setTempSmsStartDate}
            />
            <DateField
              label="End Date"
              ariaLabel="End date"
              value={tempSmsEndDate}
              onChange={setTempSmsEndDate}
              min={tempStartValid ? tempSmsStartDate : undefined}
            />
          </div>
          <div className={styles.dateDialogActions}>
            <SecondaryButton
              size="2"
              text="Cancel"
              onClick={() => {
                setShowSmsDateModal(false);
                setTempSmsStartDate(toDateFieldValue(smsCustomStartDate));
                setTempSmsEndDate(toDateFieldValue(smsCustomEndDate));
              }}
            />
            <PrimaryButton
              size="2"
              text="Done"
              onClick={() => {
                setSmsCustomStartDate(parseDateFieldValue(tempSmsStartDate));
                setSmsCustomEndDate(parseDateFieldValue(tempSmsEndDate));
                setShowSmsDateModal(false);
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default UsageContent;
