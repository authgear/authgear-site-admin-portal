import React from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import { Heading } from "@radix-ui/themes";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import styles from "./PageHeader.module.css";

// Page header for drill-down screens: a "‹ Parent" back link above the page
// title. Ported from the Authgear portal's RoleAndGroupsLayout header
// (authgear-server/portal/src/RoleAndGroupsLayout.tsx), which replaced its
// breadcrumbs.

export interface PageHeaderBackLink {
  to: string;
  label: React.ReactNode;
}

export interface PageHeaderProps {
  className?: string;
  backLink?: PageHeaderBackLink;
  title: React.ReactNode;
  /** Shown at the end of the title row, e.g. copy or pin buttons. */
  titleAccessory?: React.ReactNode;
  /** Shown under the title, e.g. metadata lines. */
  children?: React.ReactNode;
}

const PageHeader: React.VFC<PageHeaderProps> = function PageHeader({
  className,
  backLink,
  title,
  titleAccessory,
  children,
}) {
  return (
    <header className={cn(styles.header, className)}>
      {backLink != null ? (
        <Link to={backLink.to} className={styles.backLink}>
          <ChevronLeftIcon className={styles.backLinkIcon} aria-hidden />
          <span>{backLink.label}</span>
        </Link>
      ) : null}
      <div className={styles.titleRow}>
        <Heading as="h1" size="5" weight="bold" className={styles.pageTitle}>
          {title}
        </Heading>
        {titleAccessory != null ? (
          <div className={styles.titleAccessory}>{titleAccessory}</div>
        ) : null}
      </div>
      {children}
    </header>
  );
};

export default PageHeader;
