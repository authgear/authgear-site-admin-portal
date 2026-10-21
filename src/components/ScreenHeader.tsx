import React, { useCallback, useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import { Avatar, DropdownMenu } from "@radix-ui/themes";
import {
  Cross1Icon,
  ExternalLinkIcon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import Logo from "./Logo";
import ScreenNav from "./ScreenNav";
import styles from "./ScreenHeader.module.css";
import { useAuthgear } from "../auth/AuthgearContext";
import { PORTAL_URL } from "../config";

const HeaderBrand: React.VFC<{ onClick?: () => void }> = function HeaderBrand({
  onClick,
}) {
  return (
    <Link to="/" className={styles.brand} onClick={onClick}>
      <Logo />
      <span className={styles.appName}>site admin</span>
    </Link>
  );
};

const ScreenHeader: React.VFC = function ScreenHeader() {
  const { userInfo, logout } = useAuthgear();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Kept mounted through the close animation, then unmounted.
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);

  const openDrawer = useCallback(() => {
    // Mount immediately so the slide-in animation plays from the start.
    setIsDrawerMounted(true);
    setIsDrawerOpen(true);
  }, []);
  const dismissDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // Delay unmount so the 200ms slide-out animation can finish.
  useEffect(() => {
    if (isDrawerOpen || !isDrawerMounted) {
      return undefined;
    }
    const timer = setTimeout(() => setIsDrawerMounted(false), 200);
    return () => clearTimeout(timer);
  }, [isDrawerOpen, isDrawerMounted]);

  // Close the drawer on Escape and lock body scroll while it is open.
  useEffect(() => {
    if (!isDrawerOpen) {
      return undefined;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isDrawerOpen]);

  const onClickLogout = useCallback(() => {
    logout().catch(() => {});
  }, [logout]);

  const email = userInfo?.email ?? null;
  const avatarFallback = useMemo(
    () => (email ?? "").trim().charAt(0).toUpperCase() || "?",
    [email]
  );

  return (
    <header className={styles.header}>
      <div className={styles.mobileView}>
        <button
          type="button"
          className={styles.hamburger}
          aria-label="Open menu"
          onClick={openDrawer}
        >
          <HamburgerMenuIcon className={styles.hamburgerIcon} />
        </button>
        {isDrawerMounted ? (
          <div
            className={cn(styles.drawer, !isDrawerOpen && styles.drawerClosing)}
            role="dialog"
            aria-modal={true}
          >
            <button
              type="button"
              className={styles.drawerOverlay}
              aria-label="Close"
              onClick={dismissDrawer}
            />
            <div className={styles.drawerPanel}>
              <div className={styles.drawerHeader}>
                <button
                  type="button"
                  className={styles.hamburger}
                  aria-label="Close menu"
                  onClick={dismissDrawer}
                >
                  <Cross1Icon className={styles.hamburgerIcon} />
                </button>
                <HeaderBrand onClick={dismissDrawer} />
              </div>
              <div className={styles.drawerBody}>
                <ScreenNav onLinkClick={dismissDrawer} />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.desktopView}>
        <HeaderBrand />
        <span
          className={styles.headerDivider}
          role="separator"
          aria-hidden={true}
        />
        <a
          href={`https://${PORTAL_URL}`}
          target="_blank"
          rel="noreferrer"
          className={styles.portalUrl}
        >
          {PORTAL_URL}
          <ExternalLinkIcon className={styles.portalUrlIcon} />
        </a>
      </div>

      <div className={styles.actions}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <button
              type="button"
              className={styles.avatarButton}
              aria-label="User menu"
            >
              <Avatar
                size="2"
                radius="full"
                variant="soft"
                color="blue"
                fallback={avatarFallback}
              />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {email != null ? (
              <>
                <div className={styles.userMenuIdentity}>
                  <span className={styles.userMenuEmail}>{email}</span>
                </div>
                <DropdownMenu.Separator />
              </>
            ) : null}
            <DropdownMenu.Item color="red" onSelect={onClickLogout}>
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </header>
  );
};

export default ScreenHeader;
