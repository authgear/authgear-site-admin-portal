import React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react";
import styles from "./PlanContent.module.css";

const BASE_PLAN_KEYS = ["Free", "Developers", "Business", "Enterprise"] as const;

interface PlanContentProps {
  currentPlan?: string;
}

const PlanContent: React.VFC<PlanContentProps> = ({ currentPlan }) => {
  const displayPlan = currentPlan && currentPlan.length > 0 ? currentPlan : "—";

  const dropdownOptions: IDropdownOption[] = React.useMemo(() => {
    const keys: string[] = [...BASE_PLAN_KEYS];
    if (currentPlan && !keys.includes(currentPlan)) {
      keys.unshift(currentPlan);
    }
    return keys.map((key) => ({ key, text: key }));
  }, [currentPlan]);

  return (
    <div className={styles.root}>
      <div className={styles.currentPlanRow}>
        <span className={styles.currentPlanLabel}>Current Plan</span>
        <span className={styles.currentPlanValue}>{displayPlan}</span>
      </div>
      <div className={styles.selectorRow}>
        <label htmlFor="plan-selector" className={styles.selectorLabel}>
          Switch Plan
        </label>
        <Dropdown
          id="plan-selector"
          options={dropdownOptions}
          selectedKey={currentPlan}
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
