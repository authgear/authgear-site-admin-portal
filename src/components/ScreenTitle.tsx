import React from "react";
import cn from "classnames";
import { Heading } from "@radix-ui/themes";
import styles from "./ScreenTitle.module.css";

export interface ScreenTitleProps {
  className?: string;
  children?: React.ReactNode;
}

const ScreenTitle: React.VFC<ScreenTitleProps> = function ScreenTitle(
  props: ScreenTitleProps
) {
  const { className, children } = props;
  return (
    <Heading
      as="h1"
      size="7"
      weight="bold"
      className={cn(styles.title, className)}
    >
      {children}
    </Heading>
  );
};

export default ScreenTitle;
