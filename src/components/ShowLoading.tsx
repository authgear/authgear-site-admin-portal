import React from "react";
import cn from "classnames";
import { Spinner } from "@radix-ui/themes";
import styles from "./ShowLoading.module.css";

export interface ShowLoadingProps {
  /** Fill the whole viewport instead of the surrounding container. */
  fullScreen?: boolean;
  className?: string;
}

const ShowLoading: React.VFC<ShowLoadingProps> = function ShowLoading({
  fullScreen = false,
  className,
}) {
  return (
    <div
      className={cn(styles.root, fullScreen && styles.fullScreen, className)}
    >
      <Spinner size="3" />
    </div>
  );
};

export default ShowLoading;
