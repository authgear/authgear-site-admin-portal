import React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react";
import styles from "./PlanContent.module.css";

const PLAN_KEYS = ["Free", "Developers", "Business", "Enterprise"] as const;

const PLAN_OPTIONS: IDropdownOption[] = PLAN_KEYS.map((key) => ({
  key,
  text: key,
}));

interface PlanContentProps {
  /** Saved/committed plan shown as "Current Plan" */
  currentPlan?: string;
  /** Value shown in the Switch Plan dropdown (may be pending) */
  selectedPlan?: string;
  onPlanChange?: (planKey: string) => void;
}

const PlanContent: React.VFC<PlanContentProps> = ({
  currentPlan,
  selectedPlan,
  onPlanChange,
}) => {
  const effectiveCurrent =
    (currentPlan && (PLAN_KEYS as readonly string[]).includes(currentPlan))
      ? currentPlan
      : "Free";
  const effectiveSelected =
    (selectedPlan && (PLAN_KEYS as readonly string[]).includes(selectedPlan))
      ? selectedPlan
      : effectiveCurrent;

  return (
    <div className={styles.root}>
      <div className={styles.currentPlanRow}>
        <span className={styles.currentPlanLabel}>Current Plan</span>
        <span className={styles.currentPlanValue}>{effectiveCurrent}</span>
      </div>
      <div className={styles.selectorRow}>
        <label htmlFor="plan-selector" className={styles.selectorLabel}>
          Switch Plan
        </label>
        <Dropdown
          id="plan-selector"
          options={PLAN_OPTIONS}
          selectedKey={effectiveSelected}
          onChange={(_e, option) => {
            if (option?.key != null) onPlanChange?.(String(option.key));
          }}
          className={styles.planDropdown}
          styles={{
            title: { fontFamily: '"Segoe UI", sans-serif' },
            dropdown: { fontFamily: '"Segoe UI", sans-serif' },
          }}
        />
      </div>
    </div>
  );
};

export default PlanContent;
