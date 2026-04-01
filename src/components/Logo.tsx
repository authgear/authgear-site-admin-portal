import React from "react";
import styles from "./Logo.module.css";

interface LogoProps {
  inverted?: boolean;
}

const Logo: React.VFC<LogoProps> = function Logo({ inverted = false }) {
  // Using Authgear logo URL as default
  const src = inverted
    ? "https://portal.authgear.com/img/logo-inverted.png"
    : "https://portal.authgear.com/img/logo.png";

  return (
    <div className={styles.logoContainer}>
      <img className={styles.logoImg} alt="Authgear" src={src} />
    </div>
  );
};

export default Logo;
