import React from "react";
import cn from "classnames";
import styles from "./FormField.module.css";
import { Text } from "@radix-ui/themes";

type FormFieldSize = "2" | "3";

type FormFieldLabelSpace = "1" | "2";

export interface FormFieldProps {
  darkMode?: boolean;
  size: FormFieldSize;
  /** Label typography size; defaults to `size` when omitted. */
  labelSize?: FormFieldSize;
  label?: React.ReactNode;
  /** Associates the label with the control it wraps (renders the label as a `<label htmlFor>`). */
  htmlFor?: string;
  optional?: boolean;
  required?: boolean;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;

  labelSpace?: FormFieldLabelSpace;
}

export function FormField({
  darkMode,
  size,
  labelSize,
  label,
  htmlFor,
  optional,
  required,
  error,
  hint,
  children,

  labelSpace = "2",
}: FormFieldProps): React.ReactElement {
  const labelContent = label ? (
    <>
      {label}
      {required ? (
        <span className={styles.formField__labelRequired} aria-hidden="true">
          &nbsp;*
        </span>
      ) : null}
      {optional ? (
        <span className={styles.formField__labelOptional}>
          &nbsp; (optional)
        </span>
      ) : null}
    </>
  ) : null;

  return (
    <div
      className={cn(
        styles.formField,
        labelSpaceClassName(labelSpace),
        darkMode ? "dark" : null
      )}
    >
      {labelContent != null ? (
        htmlFor != null ? (
          <Text
            as="label"
            htmlFor={htmlFor}
            size={labelSize ?? size}
            weight={"medium"}
            className={styles.formField__label}
          >
            {labelContent}
          </Text>
        ) : (
          <Text
            as="p"
            size={labelSize ?? size}
            weight={"medium"}
            className={styles.formField__label}
          >
            {labelContent}
          </Text>
        )
      ) : null}
      <div className={styles.formField__inputContainer}>
        {children}
        {error != null ? (
          <Text
            as="p"
            className={styles.formField__errorMessage}
            size={"1"}
            weight={"regular"}
          >
            {error}
          </Text>
        ) : null}
        {hint != null ? (
          <Text
            as="p"
            className={styles.formField__hint}
            size={"1"}
            weight={"regular"}
          >
            {hint}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

function labelSpaceClassName(space: FormFieldLabelSpace) {
  switch (space) {
    case "1":
      return styles["formField--space1"];
    case "2":
      return styles["formField--space2"];
  }
}
