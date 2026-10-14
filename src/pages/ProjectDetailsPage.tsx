import React, { useState, useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  IconButton,
  Progress,
  Tabs,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import {
  CheckIcon,
  CopyIcon,
  DrawingPinFilledIcon,
  DrawingPinIcon,
  MagnifyingGlassIcon,
  StopIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { getApp, getAppMonthlyActiveUsers } from "../api/siteadmin";
import type { AppDetail } from "../api/types";
import UsageContent, { MAU_CAP } from "./UsageContent";
import PlanContent from "./PlanContent";
import PortalAdminContent from "./PortalAdminContent";
import AuditLogContent from "./AuditLogContent";
import FeatureConfigContent from "./FeatureConfigContent";
import PageHeader, { type PageHeaderBackLink } from "../components/PageHeader";
import { usePinnedProjects } from "../utils/pinnedProjects";
import ShowLoading from "../components/ShowLoading";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
import styles from "./ProjectDetailsPage.module.css";

type TabKey =
  | "overview"
  | "usage"
  | "plan"
  | "portalAdmin"
  | "auditLog"
  | "featureConfig";

/** URL hash segment for each tab */
const TAB_KEY_TO_HASH: Record<TabKey, string> = {
  overview: "overview",
  usage: "usage",
  plan: "plan",
  portalAdmin: "portal-admin",
  auditLog: "audit-log",
  featureConfig: "feature-config",
};

const HASH_TO_TAB_KEY: Record<string, TabKey> = {
  overview: "overview",
  usage: "usage",
  plan: "plan",
  "portal-admin": "portalAdmin",
  "audit-log": "auditLog",
  "feature-config": "featureConfig",
};

function tabKeyFromHash(hash: string): TabKey {
  const segment = hash.replace(/^#/, "").toLowerCase() || "overview";
  return HASH_TO_TAB_KEY[segment] ?? "overview";
}

function isTabKey(value: string): value is TabKey {
  return Object.prototype.hasOwnProperty.call(TAB_KEY_TO_HASH, value);
}

interface OverviewUsageCardsProps {
  userCount: number;
  mauCurrent: number | null;
  mauLoading: boolean;
}

function OverviewUsageCards({
  userCount,
  mauCurrent,
  mauLoading,
}: OverviewUsageCardsProps) {
  const mauPercent =
    mauCurrent != null ? Math.min(100, (mauCurrent / MAU_CAP) * 100) : 0;
  const mauDisplay = mauLoading
    ? "—"
    : mauCurrent != null && mauCurrent > 0
      ? `${mauCurrent.toLocaleString()} / ${MAU_CAP.toLocaleString()}`
      : "—";

  return (
    <div className={styles.usageGrid}>
      <div className={styles.usageCard}>
        <Text as="p" size="2" color="gray" className={styles.usageCardLabel}>
          Total number of users
        </Text>
        <Text as="p" size="6" weight="bold" className={styles.usageCardValue}>
          {userCount.toLocaleString()}
        </Text>
      </div>
      <div className={styles.usageCard}>
        <Text as="p" size="2" color="gray" className={styles.usageCardLabel}>
          Monthly Active User
        </Text>
        <div className={styles.usageCardProgressRow}>
          <div className={styles.usageCardProgressBar}>
            <Progress
              size="1"
              value={!mauLoading && mauCurrent != null ? mauPercent : 0}
              aria-label="Monthly active users"
            />
          </div>
          <Text
            as="span"
            size="2"
            weight="medium"
            className={styles.usageCardProgressValue}
          >
            {mauDisplay}
          </Text>
        </div>
      </div>
    </div>
  );
}

const BACK_TO_PROJECTS: PageHeaderBackLink = { to: "/", label: "Projects" };

const ProjectDetailsPage: React.VFC = function ProjectDetailsPage() {
  const { projectId } = useParams<"projectId">();
  const { isPinned, toggle: togglePin } = usePinnedProjects();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTab, setSelectedTab] = useState<TabKey>(() =>
    tabKeyFromHash(location.hash)
  );
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyEmailFeedback, setCopyEmailFeedback] = useState(false);

  const [appDetail, setAppDetail] = useState<AppDetail | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [appErrorMessage, setAppErrorMessage] = useState<string | null>(null);

  const [mauCurrent, setMauCurrent] = useState<number | null>(null);
  const [mauLoading, setMauLoading] = useState(false);

  useEffect(() => {
    const tab = tabKeyFromHash(location.hash);
    setSelectedTab(tab);
  }, [location.hash]);

  useEffect(() => {
    if (projectId && !location.hash) {
      navigate(`/project/${projectId}#overview`, { replace: true });
    }
  }, [projectId, location.hash, navigate]);

  useEffect(() => {
    if (!projectId) return;
    setAppLoading(true);
    setAppDetail(null);
    setAppErrorMessage(null);
    getApp(projectId)
      .then(setAppDetail)
      .catch((e: unknown) => {
        const msg =
          e instanceof Error ? e.message : "Failed to load project details.";
        setAppErrorMessage(msg);
      })
      .finally(() => setAppLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !appDetail) return;
    setMauLoading(true);
    const now = new Date();
    getAppMonthlyActiveUsers(
      projectId,
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCFullYear(),
      now.getUTCMonth() + 1
    )
      .then((res) => setMauCurrent(res.counts[0]?.count ?? 0))
      .catch(() => setMauCurrent(null))
      .finally(() => setMauLoading(false));
  }, [projectId, appDetail]);

  const onTabChange = useCallback(
    (value: string) => {
      if (isTabKey(value) && projectId) {
        const hash = TAB_KEY_TO_HASH[value];
        // selectedTab is derived from location.hash by the effect above, not
        // set here directly -- if a tab holds an unsaved-changes blocker
        // (e.g. Feature Config), that blocker only gets a chance to
        // intercept because navigate() hasn't actually committed yet when
        // this fires. Setting selectedTab eagerly here would switch tabs
        // (unmounting the blocking component) regardless of whether the
        // navigation was blocked.
        navigate(`/project/${projectId}#${hash}`, { replace: true });
      }
    },
    [navigate, projectId]
  );

  const copyProjectId = useCallback(() => {
    if (!appDetail?.id) return;
    void navigator.clipboard.writeText(appDetail.id);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, [appDetail?.id]);

  const copyEmail = useCallback(() => {
    if (!appDetail?.owner_email) return;
    void navigator.clipboard.writeText(appDetail.owner_email);
    setCopyEmailFeedback(true);
    setTimeout(() => setCopyEmailFeedback(false), 1500);
  }, [appDetail?.owner_email]);

  const goToProjects = useCallback(() => navigate("/"), [navigate]);

  if (appLoading) {
    return (
      <div className={styles.root}>
        <ShowLoading />
      </div>
    );
  }

  if (appErrorMessage != null || !appDetail) {
    return (
      <div className={styles.root}>
        <PageHeader backLink={BACK_TO_PROJECTS} title={projectId ?? ""} />
        <div className={styles.notFoundContainer}>
          <MagnifyingGlassIcon
            className={styles.notFoundIcon}
            aria-hidden={true}
          />
          <Text
            as="p"
            size="5"
            weight="bold"
            className={styles.notFoundHeading}
          >
            Project not found
          </Text>
          <Text
            as="p"
            size="2"
            color="gray"
            className={styles.notFoundDescription}
          >
            {appErrorMessage ??
              "The project you’re looking for doesn’t exist or may have been removed."}
          </Text>
          <PrimaryButton
            size="2"
            text="Back to Projects"
            onClick={goToProjects}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        backLink={BACK_TO_PROJECTS}
        title={appDetail.id}
        titleAccessory={
          <>
            <Tooltip content="Copy project ID">
              <IconButton
                type="button"
                size="1"
                variant="ghost"
                color="gray"
                onClick={copyProjectId}
                aria-label="Copy project ID"
              >
                {copyFeedback ? <CheckIcon /> : <CopyIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip
              content={
                isPinned(appDetail.id) ? "Unpin from sidebar" : "Pin to sidebar"
              }
            >
              <IconButton
                type="button"
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => togglePin(appDetail.id)}
                aria-label={
                  isPinned(appDetail.id) ? "Unpin project" : "Pin project"
                }
                aria-pressed={isPinned(appDetail.id)}
              >
                {isPinned(appDetail.id) ? (
                  <DrawingPinFilledIcon />
                ) : (
                  <DrawingPinIcon />
                )}
              </IconButton>
            </Tooltip>
          </>
        }
      >
        <div className={styles.projectMeta}>
          {appDetail.owner_email ? (
            <button
              type="button"
              onClick={copyEmail}
              aria-label="Copy owner email"
              className={styles.copyEmailBtn}
            >
              <span className={styles.metaText}>{appDetail.owner_email}</span>
              {copyEmailFeedback ? (
                <CheckIcon className={styles.copyEmailIcon} />
              ) : (
                <CopyIcon className={styles.copyEmailIcon} />
              )}
            </button>
          ) : (
            <span className={styles.metaTextItalic}>No owner</span>
          )}
          <span className={styles.metaText}>
            Created at{" "}
            {new Date(appDetail.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </span>
        </div>
      </PageHeader>

      <Tabs.Root
        className={styles.tabsSection}
        value={selectedTab}
        onValueChange={onTabChange}
      >
        <Tabs.List size="2">
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="usage">Usage</Tabs.Trigger>
          <Tabs.Trigger value="plan">Plan</Tabs.Trigger>
          <Tabs.Trigger value="portalAdmin">Portal Admin</Tabs.Trigger>
          <Tabs.Trigger value="featureConfig">Feature Config</Tabs.Trigger>
          <Tabs.Trigger value="auditLog">Site Admin Log</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className={styles.tabContent}>
          <Text as="p" size="5" weight="bold" className={styles.sectionHeading}>
            Usage
          </Text>
          <OverviewUsageCards
            userCount={appDetail.user_count}
            mauCurrent={mauCurrent}
            mauLoading={mauLoading}
          />

          <Text as="p" size="5" weight="bold" className={styles.sectionHeading}>
            Project Status
          </Text>
          <div className={styles.projectStatusSection}>
            <div className={styles.projectStatusRow}>
              <div className={styles.projectStatusContent}>
                <Text
                  as="p"
                  size="3"
                  weight="medium"
                  className={styles.projectStatusHeading}
                >
                  Disable Project
                </Text>
                <Text
                  as="p"
                  size="2"
                  color="gray"
                  className={styles.projectStatusDescription}
                >
                  Temporarily disables this project. Authgear services will stop
                  functioning for this project until it is re-enabled. No data
                  will be removed.
                </Text>
              </div>
              <div className={styles.projectStatusAction}>
                <Button
                  type="button"
                  size="2"
                  variant="outline"
                  color="gray"
                  disabled={true}
                >
                  <StopIcon />
                  Disable project
                </Button>
                <Text as="p" size="1" color="gray">
                  This feature is not yet available.
                </Text>
              </div>
            </div>
            <div className={styles.projectStatusDivider} />
            <div className={styles.projectStatusRow}>
              <div className={styles.projectStatusContent}>
                <Text
                  as="p"
                  size="3"
                  weight="medium"
                  className={styles.projectStatusHeading}
                >
                  Delete Project
                </Text>
                <Text
                  as="p"
                  size="2"
                  color="gray"
                  className={styles.projectStatusDescription}
                >
                  Permanently deletes this project and all associated data. This
                  action cannot be undone.
                </Text>
              </div>
              <div className={styles.projectStatusAction}>
                <Button
                  type="button"
                  size="2"
                  variant="outline"
                  color="red"
                  disabled={true}
                >
                  <TrashIcon />
                  Delete Project
                </Button>
                <Text as="p" size="1" color="gray">
                  This feature is not yet available.
                </Text>
              </div>
            </div>
          </div>
        </Tabs.Content>
        <Tabs.Content value="usage" className={styles.tabContent}>
          <UsageContent appId={appDetail.id} />
        </Tabs.Content>
        <Tabs.Content value="plan" className={styles.tabContent}>
          <PlanContent
            appId={appDetail.id}
            currentPlan={appDetail.plan}
            onPlanChanged={(planName) =>
              setAppDetail((prev) =>
                prev ? { ...prev, plan: planName } : prev
              )
            }
          />
        </Tabs.Content>
        <Tabs.Content value="portalAdmin" className={styles.tabContent}>
          <PortalAdminContent appId={appDetail.id} />
        </Tabs.Content>
        <Tabs.Content
          value="featureConfig"
          className={styles.tabContentFullWidth}
        >
          <FeatureConfigContent appId={appDetail.id} />
        </Tabs.Content>
        <Tabs.Content value="auditLog" className={styles.tabContentFullWidth}>
          <AuditLogContent appId={appDetail.id} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default ProjectDetailsPage;
