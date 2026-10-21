import React, { useCallback, useEffect, useState } from "react";
import { Select, Spinner, Text } from "@radix-ui/themes";
import { changeAppPlan, listPlans } from "../api/siteadmin";
import { Callout } from "../components/v2/Callout/Callout";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
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
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(
    currentPlan
  );
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

  const planOptions: string[] = React.useMemo(() => {
    const keys = new Set<string>(plans ?? []);
    if (currentPlan) keys.add(currentPlan);
    // Radix Select items cannot have an empty-string value.
    return Array.from(keys).filter((key) => key !== "");
  }, [plans, currentPlan]);

  const onChange = useCallback((value: string) => {
    setSelectedPlan(value);
    setSuccess(false);
    setSubmitError(null);
  }, []);

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
      <div className={styles.card}>
        <div className={styles.field}>
          <Text as="p" size="2" weight="medium" className={styles.label}>
            Current Plan
          </Text>
          <Text as="p" size="2" className={styles.value}>
            {displayPlan}
          </Text>
        </div>
        <div className={styles.field}>
          <Text
            as="label"
            size="2"
            weight="medium"
            htmlFor="plan-selector"
            className={styles.label}
          >
            Switch Plan
          </Text>
          {plans == null && plansError == null ? (
            <Spinner size="2" />
          ) : (
            <Select.Root
              size="2"
              value={selectedPlan ?? ""}
              onValueChange={onChange}
              disabled={submitting}
            >
              <Select.Trigger
                id="plan-selector"
                className={styles.planSelect}
                placeholder="Select a plan"
              />
              <Select.Content position="popper">
                {planOptions.map((plan) => (
                  <Select.Item key={plan} value={plan}>
                    {plan}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </div>
        {plansError ? (
          <Callout type="error" text={plansError} showCloseButton={false} />
        ) : null}
        {submitError ? (
          <Callout type="error" text={submitError} showCloseButton={false} />
        ) : null}
        {success ? (
          <Callout
            type="success"
            text="Plan updated."
            showCloseButton={false}
          />
        ) : null}
        <div>
          <PrimaryButton
            size="2"
            text="Switch Plan"
            loading={submitting}
            onClick={onSubmit}
            disabled={!canSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default PlanContent;
