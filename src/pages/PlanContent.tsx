import React, { useCallback, useEffect, useState } from "react";
import {
  Dropdown,
  IDropdownOption,
  PrimaryButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
} from "@fluentui/react";
import { changeAppPlan, listPlans } from "../api/siteadmin";
import styles from "./PlanContent.module.css";

interface PlanContentProps {
  appId: string;
  currentPlan?: string;
  onPlanChanged?: (planName: string) => void;
}

const PlanContent: React.VFC<PlanContentProps> = ({
  appId,
  currentPlan,
  onPlanChanged,
}) => {
  const displayPlan = currentPlan && currentPlan.length > 0 ? currentPlan : "—";

  const [plans, setPlans] = useState<string[] | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(currentPlan);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setSelectedPlan(currentPlan);
  }, [currentPlan]);

  useEffect(() => {
    setPlansError(null);
    listPlans()
      .then((res) => setPlans(res.plans.map((p) => p.name)))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to load plans.";
        setPlansError(msg);
        setPlans([]);
      });
  }, []);

  const dropdownOptions: IDropdownOption[] = React.useMemo(() => {
    const keys = new Set<string>(plans ?? []);
    if (currentPlan) keys.add(currentPlan);
    return Array.from(keys).map((key) => ({ key, text: key }));
  }, [plans, currentPlan]);

  const onChange = useCallback(
    (_e: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (option) {
        setSelectedPlan(option.key as string);
        setSuccess(false);
        setSubmitError(null);
      }
    },
    []
  );

  const onSubmit = useCallback(() => {
    if (!selectedPlan || selectedPlan === currentPlan) return;
    setSubmitting(true);
    setSubmitError(null);
    setSuccess(false);
    changeAppPlan(appId, selectedPlan)
      .then((updated) => {
        setSuccess(true);
        onPlanChanged?.(updated.plan);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to change plan.";
        setSubmitError(msg);
      })
      .finally(() => setSubmitting(false));
  }, [appId, selectedPlan, currentPlan, onPlanChanged]);

  const canSubmit =
    !submitting &&
    selectedPlan != null &&
    selectedPlan !== currentPlan &&
    plans != null;

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
        {plans == null && plansError == null ? (
          <Spinner size={SpinnerSize.small} />
        ) : (
          <Dropdown
            id="plan-selector"
            options={dropdownOptions}
            selectedKey={selectedPlan}
            onChange={onChange}
            disabled={submitting}
            className={styles.planDropdown}
            styles={{
              title: { fontFamily: '"Segoe UI", sans-serif' },
              dropdown: { fontFamily: '"Segoe UI", sans-serif' },
            }}
          />
        )}
        {plansError && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {plansError}
          </MessageBar>
        )}
        {submitError && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {submitError}
          </MessageBar>
        )}
        {success && (
          <MessageBar
            messageBarType={MessageBarType.success}
            isMultiline={false}
          >
            Plan updated.
          </MessageBar>
        )}
        <div>
          <PrimaryButton
            text={submitting ? "Switching…" : "Switch Plan"}
            onClick={onSubmit}
            disabled={!canSubmit}
            styles={{
              root: { backgroundColor: "#176df3", borderColor: "#176df3" },
              rootHovered: { backgroundColor: "#1562db", borderColor: "#1562db" },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PlanContent;
