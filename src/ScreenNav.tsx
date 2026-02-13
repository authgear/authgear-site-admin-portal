import React, { useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Nav, INavLinkGroup } from "@fluentui/react";

const ScreenNav: React.VFC = function ScreenNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isTeamsRoute = pathname === "/teams" || pathname.startsWith("/teams/");

  const navGroups: INavLinkGroup[] = useMemo(
    () => [
      {
        links: [
          {
            key: "teams",
            name: "Teams",
            url: "/teams",
          },
        ],
      },
    ],
    []
  );

  const onLinkClick = useCallback(
    (ev?: React.MouseEvent<HTMLElement>, item?: { url?: string }) => {
      if (item?.url) {
        ev?.preventDefault();
        navigate(item.url);
      }
    },
    [navigate]
  );

  return (
    <Nav
      groups={navGroups}
      selectedKey={isTeamsRoute ? "teams" : undefined}
      onLinkClick={onLinkClick}
    />
  );
};

export default ScreenNav;
