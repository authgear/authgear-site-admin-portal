import React from "react";
import cn from "classnames";
import styles from "./Logo.module.css";
import logoColorSrc from "../assets/logo-color.svg";
import logoWhiteSrc from "../assets/logo-white.svg";

/**
 * "color" is the blue-and-black mark for light surfaces such as the header.
 * "white" is for dark or brand-coloured surfaces.
 */
export type LogoVariant = "color" | "white";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
}

const Logo: React.VFC<LogoProps> = function Logo({
  variant = "color",
  className,
}) {
  const src = variant === "white" ? logoWhiteSrc : logoColorSrc;

  return (
    <div className={cn(styles.logoContainer, className)}>
      <img className={styles.logoImg} alt="Authgear" src={src} />
    </div>
  );
};

export default Logo;
