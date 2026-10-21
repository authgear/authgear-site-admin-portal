import React, { useCallback, useMemo, useRef } from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { TextField } from "../TextField/TextField";
import styles from "./DateField.module.css";

const PLACEHOLDER = "yyyy-MM-dd";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Values are calendar dates (yyyy-MM-dd) with no time zone; validate them
// with UTC so the result never depends on the viewer's local time.
function isValidDateString(value: string): boolean {
  const m = DATE_PATTERN.exec(value);
  if (m == null) {
    return false;
  }
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d
  );
}

export interface DateFieldProps {
  size?: "2" | "3";
  label?: React.ReactNode;
  /** Optional label typography size; defaults to `size` when omitted. */
  labelSize?: "2" | "3";
  disabled?: boolean;
  /** yyyy-MM-dd string, or empty string when unset. */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  /** Accessible name for the native date picker control. */
  ariaLabel?: string;
}

/**
 * Date-only field that always displays `yyyy-MM-dd`, keeps a calendar icon,
 * and opens the native date picker when the input (or icon) is clicked.
 */
export function DateField(props: DateFieldProps): React.ReactElement {
  const {
    size = "2",
    label,
    labelSize,
    disabled,
    value,
    onChange,
    min,
    max,
    placeholder = PLACEHOLDER,
    ariaLabel,
  } = props;

  const pickerRef = useRef<HTMLInputElement>(null);

  // Native date inputs only accept a valid yyyy-MM-dd value.
  const pickerValue = useMemo(() => {
    if (value === "") {
      return "";
    }
    return isValidDateString(value) ? value : "";
  }, [value]);

  const openPicker = useCallback(() => {
    if (disabled) {
      return;
    }
    const input = pickerRef.current;
    if (input == null) {
      return;
    }
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    }
  }, [disabled]);

  const onChangeText = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  const onPickDate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // input[type=date] always yields yyyy-MM-dd (or "").
      onChange(event.target.value);
    },
    [onChange]
  );

  const pickerAriaLabel =
    ariaLabel ?? (typeof label === "string" ? label : placeholder);

  return (
    <TextField
      size={size}
      labelSize={labelSize}
      type="text"
      label={label}
      value={value}
      placeholder={placeholder}
      onChange={onChangeText}
      onClick={openPicker}
      disabled={disabled}
      inputClassName={styles.root}
      suffixPlain={true}
      suffix={
        <span className={styles.pickerWrap} onClick={openPicker}>
          <CalendarIcon
            className={styles.pickerIcon}
            width="1rem"
            height="1rem"
            aria-hidden={true}
          />
          <input
            ref={pickerRef}
            type="date"
            className={styles.nativePicker}
            value={pickerValue}
            min={min}
            max={max}
            onChange={onPickDate}
            disabled={disabled}
            tabIndex={-1}
            aria-label={pickerAriaLabel}
          />
        </span>
      }
    />
  );
}
