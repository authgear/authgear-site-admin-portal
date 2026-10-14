import React, { useCallback } from "react";
import { ConfirmationDialog } from "./v2/ConfirmationDialog/ConfirmationDialog";

export interface BlockerDialogProps {
  hidden: boolean;
  title: string;
  subText: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onDismiss?: () => void;
}

const BlockerDialog: React.VFC<BlockerDialogProps> = function BlockerDialog({
  hidden,
  title,
  subText,
  confirmText = "Leave",
  cancelText = "Stay",
  onConfirm,
  onDismiss,
}) {
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onDismiss?.();
      }
    },
    [onDismiss]
  );

  return (
    <ConfirmationDialog
      open={!hidden}
      onOpenChange={onOpenChange}
      title={title}
      description={subText}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={() => onConfirm?.()}
      onCancel={() => onDismiss?.()}
    />
  );
};

export default BlockerDialog;
