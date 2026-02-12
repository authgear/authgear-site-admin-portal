import React, { useMemo, useState, useCallback } from "react";
import { Nav, INavLink, INavLinkGroup, INavStyleProps } from "@fluentui/react";

function getStyles(props: INavStyleProps) {
  return {
    chevronButton: {
      backgroundColor: "transparent",
    },
    chevronIcon: {
      transform: props.isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
    },
  };
}

const ScreenNav: React.VFC = function ScreenNav() {
  const [expandState, setExpandState] = useState<Record<string, boolean>>({
    advanced: true,
  });

  const navGroups: INavLinkGroup[] = useMemo(
    () => [
      {
        links: [
          {
            key: "teams",
            name: "Teams",
            url: "#",
          },
          {
            key: "advanced",
            name: "Advanced",
            url: "",
            isExpanded: expandState.advanced,
            links: [
              {
                key: "endpoint-direct-access",
                name: "Endpoint Direct Access",
                url: "#",
              },
              {
                key: "edit-config",
                name: "Edit Config",
                url: "#",
              },
              {
                key: "otp-test-mode",
                name: "OTP Test mode",
                url: "#",
              },
              {
                key: "saml-certificate",
                name: "SAML Certificate",
                url: "#",
              },
            ],
          },
        ],
      },
    ],
    [expandState]
  );

  const onLinkExpandClick = useCallback(
    (e?: React.MouseEvent, item?: INavLink) => {
      e?.stopPropagation();
      e?.preventDefault();
      const key = item?.key;
      if (key != null) {
        setExpandState((s) => ({ ...s, [key]: !Boolean(s[key]) }));
      }
    },
    []
  );

  return (
    <Nav
      groups={navGroups}
      selectedKey="teams"
      onLinkExpandClick={onLinkExpandClick}
      styles={getStyles}
    />
  );
};

export default ScreenNav;
