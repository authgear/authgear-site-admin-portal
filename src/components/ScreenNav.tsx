import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Nav, INavLinkGroup, INavLink, SearchBox } from "@fluentui/react";
import { MOCK_TEAMS } from "../data/teams";
import styles from "./ScreenNav.module.css";

const SIDEBAR_PAGE_SIZE = 5;
const SIDEBAR_INITIAL_COUNT = 15;

const ScreenNav: React.VFC = function ScreenNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(SIDEBAR_INITIAL_COUNT);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollReady, setScrollReady] = useState(false);

  useEffect(() => {
    setScrollReady(true);
  }, []);

  /* Reset visible count when search changes */
  useEffect(() => {
    setVisibleCount(SIDEBAR_INITIAL_COUNT);
  }, [searchQuery]);

  const query = searchQuery.trim().toLowerCase();
  const filteredTeams = useMemo(() => {
    if (!query) return MOCK_TEAMS;
    return MOCK_TEAMS.filter(
      (p) =>
        p.projectName.toLowerCase().includes(query) ||
        p.projectId.toLowerCase().includes(query)
    );
  }, [query]);

  const totalFiltered = filteredTeams.length;

  /* Lazy load: when user scrolls near bottom of sidebar, show 5 more */
  useEffect(() => {
    const scrollEl = wrapperRef.current;
    if (!scrollEl || visibleCount >= totalFiltered) return;
    const onScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = scrollEl;
      const threshold = 80;
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        setVisibleCount((c) => Math.min(c + SIDEBAR_PAGE_SIZE, totalFiltered));
      }
    };
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, [visibleCount, totalFiltered, scrollReady]);

  /* Derive selectedKey from URL (no "teams" item; only project keys) */
  const selectedKey = (() => {
    if (pathname === "/") return undefined;
    const segments = pathname.split("/");
    // pathname is /project/:projectId/...
    if (segments[1] === "project" && segments[2]) return `project-${segments[2]}`;
    return undefined;
  })();

  const visibleTeams = useMemo(
    () => filteredTeams.slice(0, visibleCount),
    [filteredTeams, visibleCount]
  );

  const navGroups: INavLinkGroup[] = useMemo(() => {
    return [
      {
        links: visibleTeams.map((project) => ({
          key: `project-${project.projectId}`,
          name: project.projectName,
          url: `/project/${project.projectId}`,
          projectName: project.projectName,
          projectId: project.projectId,
        })),
      },
    ];
  }, [visibleTeams]);

  const onLinkClick = useCallback(
    (ev?: React.MouseEvent<HTMLElement>, item?: { url?: string }) => {
      if (item?.url) {
        ev?.preventDefault();
        navigate(item.url);
      }
    },
    [navigate]
  );

  const onRenderLink = useCallback((link?: INavLink & { projectId?: string; projectName?: string }, defaultRender?: (l?: INavLink) => React.ReactNode): React.ReactElement | null => {
    if (!link) return null;
    if (link.projectId != null && link.projectName != null) {
      const isSelected =
        link.key === selectedKey ||
        (link.url != null && (pathname === link.url || pathname.startsWith(link.url + "/")));
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left", width: "100%", margin: "6px 0" }}>
          <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 400, lineHeight: 1.2 }}>{link.projectName}</span>
          <span style={{ fontSize: 12, color: "#605e5c", lineHeight: 1.2 }}>{link.projectId}</span>
        </div>
      );
    }
    const rendered = defaultRender ? defaultRender(link) : null;
    return (rendered != null && typeof rendered === "object" && "type" in rendered ? rendered : <span>{link.name}</span>) as React.ReactElement;
  }, [selectedKey, pathname]);

  const noAnimation = { transition: "none", animation: "none" };

  return (
    <div ref={wrapperRef} className={styles.sidebarWrap}>
      <div className={styles.sidebarSearch}>
        <SearchBox
          className={styles.sidebarSearchBox}
          placeholder="Search Projects Name"
          value={searchQuery}
          onChange={(_, value) => setSearchQuery(value ?? "")}
          underlined
        />
      </div>
      <div className={styles.sidebarNavScroll}>
        <Nav
      key={selectedKey ?? pathname}
      groups={navGroups}
      selectedKey={selectedKey}
      onLinkClick={onLinkClick}
      onRenderLink={onRenderLink}
      styles={(props) => ({
        root: noAnimation,
        linkText: noAnimation,
        chevronButton: noAnimation,
        chevronIcon: noAnimation,
        navItems: noAnimation,
        navItem: { marginBottom: 8, ...noAnimation },
        group: noAnimation,
        groupContent: noAnimation,
        compositeLink: [noAnimation],
        link: [
          noAnimation,
          props.isSelected &&
            props.theme && {
              backgroundColor: props.theme.semanticColors.bodyBackgroundChecked,
              fontWeight: 600,
              color: props.theme.semanticColors.bodyTextChecked,
              selectors: {
                "&::after": {
                  borderLeft: `2px solid ${props.theme.palette.themePrimary}`,
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  pointerEvents: "none",
                },
              },
            },
        ],
      })}
    />
      </div>
    </div>
  );
};

export default ScreenNav;
