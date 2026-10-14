import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Button, IconButton, RadioGroup, Select } from "@radix-ui/themes";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { FormField } from "../../components/v2/FormField/FormField";
import { TextField } from "../../components/v2/TextField/TextField";
import styles from "./UsageLimitListFieldControl.module.css";

export interface UsageLimitRule {
  quota: number;
  period: "day" | "month";
  action: "alert" | "block";
}

export interface UsageLimitListFieldControlProps {
  /**
   * Current override value:
   * - `undefined` — not overridden, inherit from plan
   * - `[]` — explicitly overridden to no limit (Limiter.Reserve treats a
   *   nil and an explicit empty rule list identically — see pkg/lib/usage/limit.go)
   * - non-empty — a specific set of quota rules
   */
  value: UsageLimitRule[] | undefined;
  disabled?: boolean;
  onChange: (value: UsageLimitRule[] | undefined) => void;
}

type Mode = "inherit" | "noLimit" | "custom";

function deriveMode(value: UsageLimitRule[] | undefined): Mode {
  if (value === undefined) return "inherit";
  if (value.length === 0) return "noLimit";
  return "custom";
}

const MODE_OPTIONS: { key: Mode; text: string }[] = [
  { key: "inherit", text: "Inherit from plan" },
  { key: "noLimit", text: "No limit" },
  { key: "custom", text: "Set limit(s)" },
];

const PERIOD_OPTIONS: { key: UsageLimitRule["period"]; text: string }[] = [
  { key: "day", text: "Day" },
  { key: "month", text: "Month" },
];

const ACTION_OPTIONS: { key: UsageLimitRule["action"]; text: string }[] = [
  { key: "alert", text: "Alert (notify only)" },
  { key: "block", text: "Block (enforce quota)" },
];

const DEFAULT_RULE: UsageLimitRule = {
  quota: 0,
  period: "month",
  action: "alert",
};

interface RuleRowProps {
  rule: UsageLimitRule;
  disabled?: boolean;
  onChange: (rule: UsageLimitRule) => void;
  onRemove: () => void;
}

/**
 * Own component (not inlined in the list) so the quota text field can hold
 * local, per-row text state -- mirroring NumberFieldControl's tolerance for
 * in-progress input (e.g. a momentarily empty field while retyping) without
 * that state getting mixed up across rows when one is added or removed.
 */
function RuleRow({ rule, disabled, onChange, onRemove }: RuleRowProps) {
  const [quotaText, setQuotaText] = useState(String(rule.quota));
  const periodId = useId();
  const actionId = useId();

  useEffect(() => {
    setQuotaText(String(rule.quota));
  }, [rule.quota]);

  const onQuotaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextText = e.currentTarget.value;
      setQuotaText(nextText);
      const parsed = Number(nextText);
      if (nextText.trim() !== "" && Number.isFinite(parsed) && parsed >= 0) {
        onChange({ ...rule, quota: Math.trunc(parsed) });
      }
    },
    [rule, onChange]
  );

  return (
    <div className={styles.ruleRow}>
      <div className={styles.quotaInput}>
        <TextField
          size="2"
          type="number"
          label="Quota"
          value={quotaText}
          disabled={disabled}
          onChange={onQuotaChange}
        />
      </div>
      <div className={styles.periodDropdown}>
        <FormField size="2" label="Period" htmlFor={periodId} labelSpace="1">
          <Select.Root
            size="2"
            value={rule.period}
            disabled={disabled}
            onValueChange={(v) =>
              onChange({ ...rule, period: v as UsageLimitRule["period"] })
            }
          >
            <Select.Trigger id={periodId} className={styles.selectTrigger} />
            <Select.Content position="popper">
              {PERIOD_OPTIONS.map((o) => (
                <Select.Item key={o.key} value={o.key}>
                  {o.text}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </FormField>
      </div>
      <div className={styles.actionDropdown}>
        <FormField size="2" label="Action" htmlFor={actionId} labelSpace="1">
          <Select.Root
            size="2"
            value={rule.action}
            disabled={disabled}
            onValueChange={(v) =>
              onChange({ ...rule, action: v as UsageLimitRule["action"] })
            }
          >
            <Select.Trigger id={actionId} className={styles.selectTrigger} />
            <Select.Content position="popper">
              {ACTION_OPTIONS.map((o) => (
                <Select.Item key={o.key} value={o.key}>
                  {o.text}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </FormField>
      </div>
      <IconButton
        type="button"
        size="2"
        variant="ghost"
        color="gray"
        className={styles.removeButton}
        title="Remove limit"
        aria-label="Remove limit"
        disabled={disabled}
        onClick={onRemove}
      >
        <TrashIcon />
      </IconButton>
    </div>
  );
}

const UsageLimitListFieldControl: React.VFC<UsageLimitListFieldControlProps> =
  function UsageLimitListFieldControl({ value, disabled, onChange }) {
    // Mirrors CountryListFieldControl: an empty "custom" list is
    // value-indistinguishable from "noLimit" by value alone -- this local
    // state lets a user keep editing a list they've emptied down to zero
    // rules without the control silently flipping back to "No limit".
    const [mode, setMode] = useState<Mode>(() => deriveMode(value));

    useEffect(() => {
      if (value === undefined) {
        setMode("inherit");
      } else if (value.length > 0) {
        setMode("custom");
      }
    }, [value]);

    const rules = useMemo(() => value ?? [], [value]);

    const onModeChange = useCallback(
      (key: string) => {
        const next = (key as Mode | undefined) ?? "inherit";
        setMode(next);
        if (next === "inherit") {
          onChange(undefined);
        } else if (next === "noLimit") {
          onChange([]);
        } else {
          onChange(value && value.length > 0 ? value : []);
        }
      },
      [onChange, value]
    );

    const updateRuleAt = useCallback(
      (index: number, nextRule: UsageLimitRule) => {
        onChange(rules.map((rule, i) => (i === index ? nextRule : rule)));
      },
      [rules, onChange]
    );

    const removeRuleAt = useCallback(
      (index: number) => {
        onChange(rules.filter((_, i) => i !== index));
      },
      [rules, onChange]
    );

    const addRule = useCallback(() => {
      onChange([...rules, DEFAULT_RULE]);
    }, [rules, onChange]);

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
        {mode === "custom" && (
          <div className={styles.rules}>
            {rules.map((rule, index) => (
              <RuleRow
                key={index}
                rule={rule}
                disabled={disabled}
                onChange={(nextRule) => updateRuleAt(index, nextRule)}
                onRemove={() => removeRuleAt(index)}
              />
            ))}
            <div>
              <Button
                type="button"
                size="2"
                variant="ghost"
                disabled={disabled}
                onClick={addRule}
              >
                <PlusIcon />
                Add limit
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

export default UsageLimitListFieldControl;
