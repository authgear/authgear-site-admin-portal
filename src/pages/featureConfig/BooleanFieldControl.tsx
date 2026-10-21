import React, { useCallback } from "react";
import { Checkbox, Text } from "@radix-ui/themes";
import { Toggle } from "../../components/v2/Toggle/Toggle";
import styles from "./BooleanFieldControl.module.css";

export interface BooleanFieldControlProps {
  /** Current override value; `undefined` means "not overridden, inherit from plan". */
  value: boolean | undefined;
  /** Effective plan value, used as the starting value when override is turned on. */
  planValue: unknown;
  disabled?: boolean;
  onChange: (value: boolean | undefined) => void;
}

const BooleanFieldControl: React.VFC<BooleanFieldControlProps> =
  function BooleanFieldControl({ value, planValue, disabled, onChange }) {
    const overridden = value !== undefined;

    const onOverrideChange = useCallback(
      (checked: boolean | "indeterminate") => {
        onChange(checked === true ? Boolean(planValue) : undefined);
      },
      [onChange, planValue]
    );

    const onValueChange = useCallback(
      (checked: boolean) => {
        onChange(Boolean(checked));
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
          <Toggle
            checked={value}
            text={value ? "Yes" : "No"}
            disabled={disabled}
            onCheckedChange={onValueChange}
          />
        )}
      </div>
    );
  };

export default BooleanFieldControl;
