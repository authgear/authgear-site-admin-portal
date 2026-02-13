import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Text,
  CommandButton,
  IconButton,
  Icon,
  Panel,
  IContextualMenuProps,
} from "@fluentui/react";
import Logo from "./Logo";
import ScreenNav from "./ScreenNav";
import styles from "./ScreenHeader.module.css";

const commandButtonStyles = {
  label: {
    fontSize: "12px",
    color: "white",
  },
  menuIcon: {
    fontSize: "12px",
    color: "white",
  },
};

const ScreenHeader: React.VFC = function ScreenHeader() {
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  const onOpenMobilePanel = useCallback(() => {
    setIsMobilePanelOpen(true);
  }, []);

  const onDismissMobilePanel = useCallback(() => {
    setIsMobilePanelOpen(false);
  }, []);

  useEffect(() => {
    if (!isMobilePanelOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevWidth = document.body.style.width;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.width = prevWidth;
    };
  }, [isMobilePanelOpen]);

  const menuProps: IContextualMenuProps = useMemo(
    () => ({
      items: [
        {
          key: "settings",
          text: "Settings",
          iconProps: {
            iconName: "PlayerSettings",
          },
        },
        {
          key: "logout",
          text: "Sign out",
          iconProps: {
            iconName: "SignOut",
          },
        },
      ],
    }),
    []
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.desktopView}>
          <div className={styles.logoContainer}>
            <Logo />
            <Text className={styles.appName}>admin</Text>
          </div>
        </div>

        <IconButton
          className={styles.mobileHamburger}
          iconProps={{ iconName: "WaffleOffice365" }}
          onClick={onOpenMobilePanel}
          ariaLabel="Open menu"
          styles={{
            root: {
              color: isMobilePanelOpen ? "#176df3" : "#ffffff",
              backgroundColor: isMobilePanelOpen ? "#ffffff" : "transparent",
            },
            rootHovered: {
              backgroundColor: "rgb(21,102,232)",
            },
            icon: {
              color: isMobilePanelOpen ? "#176df3" : "#ffffff",
              fontSize: 16,
            },
          }}
        />

        <div className={styles.links}>
          <Text variant="small" className={styles.link}>
            Schedule demo
          </Text>
          <Text variant="small" className={styles.link}>
            Documentation
          </Text>
        </div>
        <CommandButton
          className={styles.userButton}
          menuProps={menuProps}
          styles={commandButtonStyles}
        >
          johndoe@gmail.com
        </CommandButton>
      </header>

      <Panel
        isOpen={isMobilePanelOpen}
        onDismiss={onDismissMobilePanel}
        type={1}
        headerText=""
        closeButtonAriaLabel="Close"
        isLightDismiss
        hasCloseButton={false}
        styles={{
          overlay: {
            backgroundColor: "rgba(255, 255, 255, 0.5)",
          },
          main: {
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)",
            left: 0,
            width: "260px",
            maxWidth: "260px",
          },
          contentInner: {
            width: "100%",
            maxWidth: "260px",
          },
          header: {
            display: "none",
          },
          commands: {
            display: "none",
          },
          scrollableContent: {
            overflow: "hidden",
          },
          content: {
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: "100%",
            height: "100%",
          },
        }}
      >
        {isMobilePanelOpen && (
          <div className={styles.mobilePanelContent}>
            <div className={styles.mobileSidebarHeader}>
              <div className={styles.mobileSidebarLogoRow}>
                <button
                  type="button"
                  className={styles.mobileSidebarGridButton}
                  onClick={onDismissMobilePanel}
                  aria-label="Close menu"
                >
                  <Icon iconName="WaffleOffice365" className={styles.mobileSidebarGridIcon} />
                </button>
                <Logo />
                <Text className={styles.mobileSidebarAppName}>admin</Text>
              </div>
            </div>
            <div className={styles.mobilePanelNav}>
              <ScreenNav />
            </div>
          </div>
        )}
      </Panel>
    </>
  );
};

export default ScreenHeader;
