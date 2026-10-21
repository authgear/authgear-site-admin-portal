import React, { useMemo } from "react";
import cn from "classnames";
import { Link, useLocation } from "react-router-dom";
import { IconButton, Tooltip } from "@radix-ui/themes";
import {
  DrawingPinFilledIcon,
  DrawingPinIcon,
  LayersIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import { usePinnedProjects } from "../utils/pinnedProjects";
import styles from "./ScreenNav.module.css";

interface ScreenNavProps {
  /** Called after a link is followed, e.g. to close the mobile drawer. */
  onLinkClick?: () => void;
}

/** The project ID in a /project/:projectId[/...] path, if any. */
function currentProjectIdFromPath(pathname: string): string | null {
  const segments = pathname.split("/");
  if (segments[1] === "project" && segments[2]) {
    return decodeURIComponent(segments[2]);
  }
  return null;
}

interface ProjectLinkProps {
  projectId: string;
  selected: boolean;
  pinned: boolean;
  onTogglePin: (projectId: string) => void;
  onLinkClick?: () => void;
}

const ProjectLink: React.VFC<ProjectLinkProps> = function ProjectLink({
  projectId,
  selected,
  pinned,
  onTogglePin,
  onLinkClick,
}) {
  const pinLabel = pinned ? `Unpin ${projectId}` : `Pin ${projectId}`;
  return (
    <div className={cn(styles.childRow, selected && styles.itemSelected)}>
      <Link
        to={`/project/${encodeURIComponent(projectId)}`}
        className={cn(styles.item, styles.childItem)}
        aria-current={selected ? "page" : undefined}
        onClick={onLinkClick}
      >
        <span className={styles.itemLabel}>{projectId}</span>
      </Link>
      <Tooltip content={pinned ? "Unpin" : "Pin to sidebar"}>
        <IconButton
          type="button"
          size="1"
          variant="ghost"
          color="gray"
          className={cn(styles.pinButton, pinned && styles.pinButtonPinned)}
          aria-label={pinLabel}
          aria-pressed={pinned}
          onClick={() => onTogglePin(projectId)}
        >
          {pinned ? <DrawingPinFilledIcon /> : <DrawingPinIcon />}
        </IconButton>
      </Tooltip>
    </div>
  );
};

const ScreenNav: React.VFC<ScreenNavProps> = function ScreenNav({
  onLinkClick,
}) {
  const { pathname } = useLocation();
  const { pinned, isPinned, toggle } = usePinnedProjects();

  const currentProjectId = currentProjectIdFromPath(pathname);

  // Current project first, then the pinned ones (without repeating it).
  const projectIds = useMemo(() => {
    const others = pinned.filter((id) => id !== currentProjectId);
    return currentProjectId != null ? [currentProjectId, ...others] : others;
  }, [pinned, currentProjectId]);

  const projectsSelected = pathname === "/";
  const auditLogSelected =
    pathname === "/audit-logs" || pathname.startsWith("/audit-logs/");

  return (
    <nav className={styles.navList} aria-label="Main navigation">
      <div className={styles.group}>
        <Link
          to="/"
          className={cn(styles.item, projectsSelected && styles.itemSelected)}
          aria-current={projectsSelected ? "page" : undefined}
          onClick={onLinkClick}
        >
          <LayersIcon className={styles.itemIcon} />
          <span className={styles.itemLabel}>Projects</span>
        </Link>
        {projectIds.length > 0 ? (
          <div className={styles.groupChildren}>
            {projectIds.map((id) => (
              <ProjectLink
                key={id}
                projectId={id}
                selected={id === currentProjectId}
                pinned={isPinned(id)}
                onTogglePin={toggle}
                onLinkClick={onLinkClick}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Link
        to="/audit-logs"
        className={cn(styles.item, auditLogSelected && styles.itemSelected)}
        aria-current={auditLogSelected ? "page" : undefined}
        onClick={onLinkClick}
      >
        <ReaderIcon className={styles.itemIcon} />
        <span className={styles.itemLabel}>Site Admin Log</span>
      </Link>
    </nav>
  );
};

export default ScreenNav;
