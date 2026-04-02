import React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react";
import styles from "./PlanContent.module.css";

const PLAN_KEYS = ["Free", "Developers", "Business", "Enterprise"] as const;

const PLAN_OPTIONS: IDropdownOption[] = PLAN_KEYS.map((key) => ({
  key,
  text: key,
}));

interface PlanContentProps {
  currentPlan?: string;
}

const PlanContent: React.VFC<PlanContentProps> = ({ currentPlan }) => {
  const effectiveCurrent =
    currentPlan && (PLAN_KEYS as readonly string[]).includes(currentPlan)
      ? currentPlan
      : "Free";

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
          selectedKey={effectiveCurrent}
          disabled
          className={styles.planDropdown}
          styles={{
            title: { fontFamily: '"Segoe UI", sans-serif' },
            dropdown: { fontFamily: '"Segoe UI", sans-serif' },
          }}
        />
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#797775" }}>
          Switching plans is not yet available.
        </p>
      </div>
    </div>
  );
};

export default PlanContent;
