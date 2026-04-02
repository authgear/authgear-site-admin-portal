import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Icon,
  Text,
  Pivot,
  PivotItem,
  PrimaryButton,
  DefaultButton,
  ActionButton,
  ProgressIndicator,
  Dialog,
  DialogFooter,
} from "@fluentui/react";
import { getProjectByProjectId, updateProjectPlan } from "../data/teams";
import AuditLogContent, { type AuditLogFiltersSnapshot } from "./AuditLogContent";
import UsageContent, { getMauDataForMonth, MAU_CAP } from "./UsageContent";
import PlanContent from "./PlanContent";
import PortalAdminContent from "./PortalAdminContent";
import styles from "./ProjectDetailsPage.module.css";

const TAB_KEYS = ["overview", "auditLog", "usage", "plan", "portalAdmin"] as const;
type TabKey = (typeof TAB_KEYS)[number];

/** URL hash segment for each tab: /(projectId)#overview, #audit-log, #usage, #plan, #portal-admin */
const TAB_KEY_TO_HASH: Record<TabKey, string> = {
  overview: "overview",
  auditLog: "audit-log",
  usage: "usage",
  plan: "plan",
  portalAdmin: "portal-admin",
};

const HASH_TO_TAB_KEY: Record<string, TabKey> = {
  overview: "overview",
  "audit-log": "auditLog",
  usage: "usage",
  plan: "plan",
  "portal-admin": "portalAdmin",
};

function tabKeyFromHash(hash: string): TabKey {
  const segment = hash.replace(/^#/, "").toLowerCase() || "overview";
  return HASH_TO_TAB_KEY[segment] ?? "overview";
}

function getInitials(projectName: string): string {
  const words = projectName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase().slice(0, 2);
  }
  return projectName.slice(0, 2).toUpperCase() || "PR";
}

/** Current calendar month key (YYYY-MM) — matches Usage tab "This Month" */
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Deterministic total user count per project (different per projectId) */
function getTotalUserCount(projectId: string | undefined): number {
  if (!projectId) return 12;
  let h = 0;
  for (let i = 0; i < projectId.length; i++) {
    h = (h * 31 + projectId.charCodeAt(i)) | 0;
  }
  return 8 + (Math.abs(h) % 493); // range 8–500
}

/** Overview usage cards: MAU and total users use same data as Usage tab / per-project values */
function OverviewUsageCards({ projectId }: { projectId?: string }) {
  const mauData = useMemo(() => getMauDataForMonth(getCurrentMonthKey(), projectId), [projectId]);
  const totalUsers = useMemo(() => getTotalUserCount(projectId), [projectId]);
  const mauPercent = Math.min(100, (mauData.current / MAU_CAP) * 100);
  const mauDisplay =
    mauData.current > 0
      ? `${mauData.current.toLocaleString()} / ${MAU_CAP.toLocaleString()}`
      : "—";
  return (
    <div className={styles.usageGrid}>
      <div className={styles.usageCard}>
        <p className={styles.usageCardLabel}>Total number of users</p>
        <p className={styles.usageCardValue}>{totalUsers}</p>
      </div>
      <div className={styles.usageCard}>
        <p className={styles.usageCardLabel}>Monthly Active User</p>
        <div className={styles.usageCardProgressRow}>
          <div className={styles.usageCardProgressBar}>
            <ProgressIndicator
              percentComplete={mauData.current > 0 ? mauPercent / 100 : 0}
              barHeight={4}
              styles={{
                root: { margin: 0 },
                progressTrack: { backgroundColor: "#edebe9" },
                progressBar: { backgroundColor: "#176df3" },
              }}
            />
          </div>
          <span className={styles.usageCardProgressValue}>{mauDisplay}</span>
        </div>
      </div>
    </div>
  );
}

/** Blue outline, no hover effects */
const projectStatusPrimaryButtonStyles = {
  root: { backgroundColor: "#ffffff", borderColor: "#176df3", color: "#176df3", fontFamily: '"Segoe UI", sans-serif' },
  rootHovered: { backgroundColor: "#ffffff", borderColor: "#176df3", color: "#176df3" },
  rootPressed: { backgroundColor: "#ffffff", borderColor: "#176df3", color: "#176df3" },
  icon: { color: "#176df3" },
  iconHovered: { color: "#176df3" },
  label: { color: "#176df3", fontFamily: '"Segoe UI", sans-serif' },
};

/** Danger outline #E23D3D, no hover effects */
const projectStatusDangerButtonStyles = {
  root: { backgroundColor: "#ffffff", borderColor: "#E23D3D", color: "#E23D3D", fontFamily: '"Segoe UI", sans-serif' },
  rootHovered: { backgroundColor: "#ffffff", borderColor: "#E23D3D", color: "#E23D3D" },
  rootPressed: { backgroundColor: "#ffffff", borderColor: "#E23D3D", color: "#E23D3D" },
  icon: { color: "#E23D3D" },
  iconHovered: { color: "#E23D3D" },
  label: { color: "#E23D3D", fontFamily: '"Segoe UI", sans-serif' },
};

const ProjectDetailsPage: React.VFC = function ProjectDetailsPage() {
  const { projectId } = useParams<"projectId">();
  const navigate = useNavigate();
  const location = useLocation();
  const project = projectId ? getProjectByProjectId(projectId) : undefined;

  const [selectedTab, setSelectedTab] = useState<TabKey>(() =>
    tabKeyFromHash(location.hash)
  );
  const [savedPlan, setSavedPlan] = useState<string>("Free");
  const [selectedPlan, setSelectedPlan] = useState<string>("Free");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isProjectDisabled, setIsProjectDisabled] = useState(false);
  const [showReenableModal, setShowReenableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentPlan = savedPlan;
  const hasUnsavedPlanChanges = selectedPlan !== savedPlan;

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
    if (project?.plan != null) {
      setSavedPlan(project.plan);
      setSelectedPlan(project.plan);
    }
  }, [project?.plan, project?.projectId]);

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      const key = item?.props.itemKey as TabKey | undefined;
      if (key && projectId) {
        const hash = TAB_KEY_TO_HASH[key];
        navigate(`/project/${projectId}#${hash}`, { replace: true });
        setSelectedTab(key);
      }
    },
    [navigate, projectId]
  );

  const copyProjectId = useCallback(() => {
    if (!project?.projectId) return;
    void navigator.clipboard.writeText(project.projectId);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, [project?.projectId]);

  if (!project) {
    return (
      <div className={styles.root}>
        <div className={styles.notFound}>Project not found.</div>
        <Link to="/" className={styles.breadcrumbLink}>
          Back to Projects
        </Link>
      </div>
    );
  }

  const initials = getInitials(project.projectName);
  const showSaveBar =
    selectedTab === "plan" ||
    (hasUnsavedChanges &&
      selectedTab !== "overview" &&
      selectedTab !== "auditLog" &&
      selectedTab !== "usage" &&
      selectedTab !== "portalAdmin");

  return (
    <div className={showSaveBar ? `${styles.root} ${styles.rootWithSaveBar}` : styles.root}>
      <div className={styles.breadcrumbRow}>
        <Text as="h1" variant="xxLarge" block className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink}>
            Projects
          </Link>
          <Icon iconName="ChevronRight" className={styles.breadcrumbSepIcon} />
          <span className={styles.breadcrumbCurrent}>Project Details</span>
        </Text>
      </div>

      <div className={styles.projectHeader}>
        <div className={styles.projectIcon} aria-hidden>
          {initials}
        </div>
        <div className={styles.projectInfo}>
          <h2 className={styles.projectName}>{project.projectName}</h2>
          <div className={styles.projectIdRow}>
            <span className={styles.projectIdText}>{project.projectId}</span>
            <button
              type="button"
              onClick={copyProjectId}
              aria-label="Copy project ID"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "#605e5c",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Icon iconName={copyFeedback ? "CheckMark" : "Copy"} />
            </button>
          </div>
          <div className={styles.projectMeta}>
            <span className={styles.metaText}>{project.ownerEmail}</span>
            <span className={styles.metaText}>Create at {project.createdAt}</span>
          </div>
        </div>
      </div>

      <div className={styles.tabsSection}>
        <Pivot
          className={styles.pivotTabs}
          selectedKey={selectedTab}
          onLinkClick={onLinkClick}
          linkSize="normal"
          linkFormat="links"
        >
          <PivotItem headerText="Overview" itemKey="overview" />
          <PivotItem headerText="Audit Log" itemKey="auditLog" />
          <PivotItem headerText="Usage" itemKey="usage" />
          <PivotItem headerText="Plan" itemKey="plan" />
          <PivotItem headerText="Portal Admin" itemKey="portalAdmin" />
        </Pivot>

        <div
          className={
            selectedTab === "auditLog" || selectedTab === "plan"
              ? `${styles.tabContent} ${styles.tabContentFullWidth}`
              : styles.tabContent
          }
        >
          {selectedTab === "overview" && (
            <>
              <h3 className={styles.sectionHeading}>Usage</h3>
              <OverviewUsageCards projectId={project?.projectId} />

              <div className={styles.sectionDivider} aria-hidden />

              <h3 className={styles.sectionHeading}>Project Status</h3>
              <div className={styles.projectStatusSection}>
                <div className={styles.projectStatusRow}>
                  <div className={styles.projectStatusContent}>
                    <h4 className={styles.projectStatusHeading}>Disable Project</h4>
                    <p className={styles.projectStatusDescription}>
                      Temporarily disables this project. Authgear services will stop functioning for
                      this project until it is re-enabled. No data will be removed.
                    </p>
                  </div>
                  <div className={styles.projectStatusAction}>
                    {isProjectDisabled ? (
                      <DefaultButton
                        text="Re-enable Project"
                        iconProps={{ iconName: "Play" }}
                        onClick={() => setShowReenableModal(true)}
                        styles={projectStatusPrimaryButtonStyles}
                      />
                    ) : (
                      <DefaultButton
                        text="Disable project"
                        iconProps={{ iconName: "Blocked" }}
                        onClick={() => setShowDisableModal(true)}
                        styles={projectStatusDangerButtonStyles}
                      />
                    )}
                  </div>
                </div>
                <div className={styles.projectStatusDivider} />
                <div className={styles.projectStatusRow}>
                  <div className={styles.projectStatusContent}>
                    <h4 className={styles.projectStatusHeading}>Delete Project</h4>
                    <p className={styles.projectStatusDescription}>
                      Permanently deletes this project and all associated data. This action cannot
                      be undone.
                    </p>
                  </div>
                  <div className={styles.projectStatusAction}>
                    <DefaultButton
                      text="Delete Project"
                      iconProps={{ iconName: "Delete" }}
                      onClick={() => setShowDeleteModal(true)}
                      styles={projectStatusDangerButtonStyles}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {selectedTab === "auditLog" && project && (
            <AuditLogContent
              projectId={project.projectId}
              initialFilters={(location.state as { auditLogFilters?: AuditLogFiltersSnapshot } | null)?.auditLogFilters ?? undefined}
            />
          )}
          {selectedTab === "usage" && project && (
            <UsageContent currentPlan={currentPlan} projectId={project.projectId} />
          )}
          {selectedTab === "plan" && project && (
            <PlanContent
              currentPlan={savedPlan}
              selectedPlan={selectedPlan}
              onPlanChange={setSelectedPlan}
            />
          )}
          {selectedTab === "portalAdmin" && <PortalAdminContent />}
        </div>
      </div>

      {showSaveBar && (
        <div className={styles.saveSection}>
          <div className={styles.saveSectionInner}>
            <PrimaryButton
              text="Save"
              disabled={selectedTab === "plan" ? !hasUnsavedPlanChanges : !hasUnsavedChanges}
              onClick={() => {
                if (selectedTab === "plan" && projectId) {
                  updateProjectPlan(projectId, selectedPlan);
                  setSavedPlan(selectedPlan);
                } else {
                  setHasUnsavedChanges(false);
                }
              }}
              styles={{
                root: {
                  fontSize: 14,
                  height: 36,
                  minWidth: 100,
                  selectors: {
                    ":not([disabled])": { backgroundColor: "#176df3" },
                    ":not([disabled]):hover": { backgroundColor: "#1562db" },
                  },
                },
                label: { padding: 0 },
              }}
            />
            <span className={styles.discardButtonWrap}>
              <ActionButton
                text="Discard changes"
                iconProps={{ iconName: "Refresh" }}
                disabled={selectedTab === "plan" ? !hasUnsavedPlanChanges : !hasUnsavedChanges}
                onClick={() => {
                  if (selectedTab === "plan") {
                    setSelectedPlan(savedPlan);
                  } else {
                    setHasUnsavedChanges(false);
                  }
                }}
                styles={{
                  root: {
                    fontSize: 14,
                    height: 32,
                    minWidth: 100,
                    color: "#E23D3D",
                  },
                  rootHovered: {
                    color: "#c93535",
                    backgroundColor: "transparent",
                  },
                  icon: {
                    color: "#E23D3D",
                  },
                  iconHovered: {
                    color: "#c93535",
                  },
                  label: {
                    color: "#E23D3D",
                  },
                }}
              />
            </span>
          </div>
        </div>
      )}

      <Dialog
        hidden={!showDisableModal}
        onDismiss={() => setShowDisableModal(false)}
        dialogContentProps={{
          title: "Disable Project",
          subText: undefined,
        }}
        modalProps={{ isBlocking: false }}
      >
        <p className={styles.dialogMessage}>
          Are you sure you want to disable <strong>{project.projectName}</strong>? All Authgear
          services for this project will stop functioning until it is re-enabled.
        </p>
        <DialogFooter>
          <PrimaryButton
            text="Disable"
            onClick={() => {
              setShowDisableModal(false);
              setIsProjectDisabled(true);
              setHasUnsavedChanges(true);
            }}
            styles={{
              root: { backgroundColor: "#e23d3d", borderColor: "#e23d3d" },
              rootHovered: { backgroundColor: "#c93535", borderColor: "#c93535" },
              rootPressed: { backgroundColor: "#b32e2e", borderColor: "#b32e2e" },
            }}
          />
          <DefaultButton text="Cancel" onClick={() => setShowDisableModal(false)} />
        </DialogFooter>
      </Dialog>

      <Dialog
        hidden={!showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        dialogContentProps={{
          title: "Delete Project",
          subText: undefined,
        }}
        modalProps={{ isBlocking: false }}
      >
        <p className={styles.dialogMessage}>
          Are you sure you want to delete <strong>{project.projectName}</strong>? This action is
          permanent. All project data and configurations will be permanently removed and cannot be
          recovered.
        </p>
        <DialogFooter>
          <PrimaryButton
            text="Delete"
            onClick={() => setShowDeleteModal(false)}
            styles={{
              root: { backgroundColor: "#e23d3d", borderColor: "#e23d3d" },
              rootHovered: { backgroundColor: "#c93535", borderColor: "#c93535" },
              rootPressed: { backgroundColor: "#b32e2e", borderColor: "#b32e2e" },
            }}
          />
          <DefaultButton text="Cancel" onClick={() => setShowDeleteModal(false)} />
        </DialogFooter>
      </Dialog>

      <Dialog
        hidden={!showReenableModal}
        onDismiss={() => setShowReenableModal(false)}
        dialogContentProps={{
          title: "Re-enable Project",
          subText: undefined,
        }}
        modalProps={{ isBlocking: false }}
      >
        <p className={styles.dialogMessage}>
          Do you really want to re-enable <strong>{project.projectName}</strong>? Users will be able
          to access this project again.
        </p>
        <DialogFooter>
          <PrimaryButton
            text="Re-enable"
            onClick={() => {
              setShowReenableModal(false);
              setIsProjectDisabled(false);
              setHasUnsavedChanges(true);
            }}
            styles={{
              root: { backgroundColor: "#176df3", borderColor: "#176df3" },
              rootHovered: { backgroundColor: "#1562c4", borderColor: "#1562c4" },
              rootPressed: { backgroundColor: "#1359b3", borderColor: "#1359b3" },
            }}
          />
          <DefaultButton text="Cancel" onClick={() => setShowReenableModal(false)} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ProjectDetailsPage;
