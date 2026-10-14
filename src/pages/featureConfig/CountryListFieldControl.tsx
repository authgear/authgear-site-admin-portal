import React, { useCallback, useEffect, useState } from "react";
import { RadioGroup } from "@radix-ui/themes";
import CountryTagPicker from "./CountryTagPicker";
import styles from "./CountryListFieldControl.module.css";

export interface CountryListFieldControlProps {
  /**
   * Current override value:
   * - `undefined` — not overridden, inherit from plan
   * - `[]` — explicitly overridden to allow all countries
   * - non-empty — restricted to these ISO 3166-1 alpha-2 codes
   */
  value: string[] | undefined;
  disabled?: boolean;
  onChange: (value: string[] | undefined) => void;
}

type Mode = "inherit" | "allowAll" | "restrict";

function deriveMode(value: string[] | undefined): Mode {
  if (value === undefined) return "inherit";
  if (value.length === 0) return "allowAll";
  return "restrict";
}

const MODE_OPTIONS: { key: Mode; text: string }[] = [
  { key: "inherit", text: "Inherit from plan" },
  { key: "allowAll", text: "Allow all countries" },
  { key: "restrict", text: "Restrict to selected countries" },
];

const CountryListFieldControl: React.VFC<CountryListFieldControlProps> =
  function CountryListFieldControl({ value, disabled, onChange }) {
    // `mode` is mostly derived from `value`, but an empty `restrict` list is
    // indistinguishable from `allowAll` by value alone — this local state
    // lets a user keep editing an emptied restrict-list without the control
    // silently flipping to "allow all countries" underneath them.
    const [mode, setMode] = useState<Mode>(() => deriveMode(value));

    useEffect(() => {
      if (value === undefined) {
        setMode("inherit");
      } else if (value.length > 0) {
        setMode("restrict");
      }
    }, [value]);

    const onModeChange = useCallback(
      (key: string) => {
        const next = (key as Mode | undefined) ?? "inherit";
        setMode(next);
        if (next === "inherit") {
          onChange(undefined);
        } else if (next === "allowAll") {
          onChange([]);
        } else {
          onChange(value && value.length > 0 ? value : []);
        }
      },
      [onChange, value]
    );

    const onCodesChange = useCallback(
      (codes: string[]) => {
        onChange(codes);
      },
      [onChange]
    );

    return (
      <div className={styles.root}>
        <RadioGroup.Root
          className={styles.modeChoice}
          size="2"
          value={mode}
          disabled={disabled}
          onValueChange={onModeChange}
        >
          {MODE_OPTIONS.map((option) => (
            <RadioGroup.Item key={option.key} value={option.key}>
              {option.text}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
        {mode === "restrict" && (
          <CountryTagPicker
            selectedCodes={value ?? []}
            onChange={onCodesChange}
            disabled={disabled}
          />
        )}
      </div>
    );
  };

export default CountryListFieldControl;
