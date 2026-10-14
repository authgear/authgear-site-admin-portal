import React, { useCallback, useEffect, useState } from "react";
import { Checkbox, Text } from "@radix-ui/themes";
import { TextField } from "../../components/v2/TextField/TextField";
import styles from "./NumberFieldControl.module.css";

export interface NumberFieldControlProps {
  /** Current override value; `undefined` means "not overridden, inherit from plan". */
  value: number | undefined;
  /** Effective plan value, used as the starting value when override is turned on. */
  planValue: unknown;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}

const NumberFieldControl: React.VFC<NumberFieldControlProps> =
  function NumberFieldControl({ value, planValue, disabled, onChange }) {
    const overridden = value !== undefined;
    // Local text mirrors `value` but tolerates in-progress input (e.g. "-",
    // "") that wouldn't parse into a committed number yet.
    const [text, setText] = useState(value != null ? String(value) : "");

    useEffect(() => {
      setText(value != null ? String(value) : "");
    }, [value]);

    const onOverrideChange = useCallback(
      (checked: boolean | "indeterminate") => {
        if (checked === true) {
          const initial = typeof planValue === "number" ? planValue : 0;
          setText(String(initial));
          onChange(initial);
        } else {
          setText("");
          onChange(undefined);
        }
      },
      [onChange, planValue]
    );

    const onTextChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextText = e.currentTarget.value;
        setText(nextText);
        const parsed = Number(nextText);
        if (nextText.trim() !== "" && Number.isFinite(parsed)) {
          onChange(Math.trunc(parsed));
        }
      },
      [onChange]
    );

    return (
      <div className={styles.root}>
        <Text as="label" size="2" className={styles.checkboxLabel}>
          <Checkbox
            checked={overridden}
            disabled={disabled}
            onCheckedChange={onOverrideChange}
          />
          Override
        </Text>
        {overridden && (
          <div className={styles.input}>
            <TextField
              size="2"
              type="number"
              value={text}
              disabled={disabled}
              onChange={onTextChange}
            />
          </div>
        )}
      </div>
    );
  };

export default NumberFieldControl;
