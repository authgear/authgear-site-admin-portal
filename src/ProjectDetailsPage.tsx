import React, { useState, useCallback, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
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
import { getProjectByProjectId } from "./data/teams";
import AuditLogContent from "./AuditLogContent";
import UsageContent from "./UsageContent";
import PortalAdminContent from "./PortalAdminContent";
import styles from "./ProjectDetailsPage.module.css";

const TAB_KEYS = ["overview", "auditLog", "usage", "plan", "portalAdmin"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function getInitials(projectName: string): string {
  const words = projectName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase().slice(0, 2);
  }
  return projectName.slice(0, 2).toUpperCase() || "PR";
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
  const project = projectId ? getProjectByProjectId(projectId) : undefined;

  const [selectedTab, setSelectedTab] = useState<TabKey>("overview");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isProjectDisabled, setIsProjectDisabled] = useState(false);
  const [showReenableModal, setShowReenableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const tab = (location.state as { tab?: TabKey } | null)?.tab;
    if (tab && TAB_KEYS.includes(tab)) setSelectedTab(tab);
  }, [location.state]);

  const onLinkClick = useCallback((item?: PivotItem) => {
    if (item?.props.itemKey) setSelectedTab(item.props.itemKey as TabKey);
  }, []);

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
        <Link to="/teams" className={styles.breadcrumbLink}>
          Back to Teams
        </Link>
      </div>
    );
  }

  const initials = getInitials(project.projectName);
  const showSaveBar =
    selectedTab !== "overview" &&
    selectedTab !== "auditLog" &&
    selectedTab !== "usage" &&
    selectedTab !== "plan" &&
    selectedTab !== "portalAdmin";

  return (
    <div className={showSaveBar ? `${styles.root} ${styles.rootWithSaveBar}` : styles.root}>
      <div className={styles.breadcrumbRow}>
        <Text as="h1" variant="xxLarge" block className={styles.breadcrumb}>
          <Link to="/teams" className={styles.breadcrumbLink}>
            Teams
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
            selectedTab === "auditLog"
              ? `${styles.tabContent} ${styles.tabContentFullWidth}`
              : styles.tabContent
          }
        >
          {selectedTab === "overview" && (
            <>
              <h3 className={styles.sectionHeading}>Usage</h3>
              <div className={styles.usageGrid}>
                <div className={styles.usageCard}>
                  <p className={styles.usageCardLabel}>Total number of users</p>
                  <p className={styles.usageCardValue}>12</p>
                </div>
                <div className={styles.usageCard}>
                  <p className={styles.usageCardLabel}>Monthly Active User</p>
                  <div className={styles.usageCardProgressRow}>
                    <div className={styles.usageCardProgressBar}>
                      <ProgressIndicator
                        percentComplete={13000 / 25000}
                        barHeight={4}
                        styles={{
                          root: { margin: 0 },
                          progressTrack: { backgroundColor: "#edebe9" },
                          progressBar: { backgroundColor: "#176df3" },
                        }}
                      />
                    </div>
                    <span className={styles.usageCardProgressValue}>13,000 / 25,000</span>
                  </div>
                </div>
              </div>

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
            <AuditLogContent projectId={project.projectId} />
          )}
          {selectedTab === "usage" && <UsageContent />}
          {selectedTab === "plan" && (
            <p className={styles.metaText}>Plan information will be listed here.</p>
          )}
          {selectedTab === "portalAdmin" && <PortalAdminContent />}
        </div>
      </div>

      {showSaveBar && (
        <div className={styles.saveSection}>
          <div className={styles.saveSectionInner}>
            <PrimaryButton
              text="Save"
              disabled={!hasUnsavedChanges}
              onClick={() => {
                setHasUnsavedChanges(false);
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
                disabled={!hasUnsavedChanges}
                onClick={() => setHasUnsavedChanges(false)}
                styles={{
                  root: {
                    fontSize: 14,
                    height: 32,
                    minWidth: 100,
                    selectors: {
                      ":not([disabled])": { color: "#E23D3D" },
                      ":not([disabled]):hover": { color: "#c93535" },
                    },
                  },
                  icon: {
                    selectors: {
                      ":not([disabled])": { color: "#E23D3D" },
                      ":not([disabled]):hover": { color: "#c93535" },
                    },
                  },
                  label: {
                    selectors: {
                      ":not([disabled])": { color: "#E23D3D" },
                      ":not([disabled]):hover": { color: "#c93535" },
                    },
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
