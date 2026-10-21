import React, { useCallback, useMemo } from "react";
import { Table } from "@radix-ui/themes";
import { CrossCircledIcon } from "@radix-ui/react-icons";
import cn from "classnames";
import { isCollection, type Document } from "yaml";
import type { FeatureConfig, ValidationErrorCause } from "../../api/types";
import { getAtPointer, parseJsonPointer } from "../../utils/jsonPointer";
import {
  FIELD_REGISTRY,
  SECTION_DESCRIPTIONS,
  FieldDef,
} from "./fieldRegistry";
import { deleteAndPruneIn } from "./yamlDocumentEdits";
import { formatDisplayValue } from "./formatDisplayValue";
import BooleanFieldControl from "./BooleanFieldControl";
import NumberFieldControl from "./NumberFieldControl";
import CountryListFieldControl from "./CountryListFieldControl";
import UsageLimitListFieldControl, {
  type UsageLimitRule,
} from "./UsageLimitListFieldControl";
import { Tooltip } from "../../components/v2/Tooltip/Tooltip";
import styles from "./FeatureConfigTableView.module.css";

export interface FeatureConfigTableViewProps {
  /** The parsed app-override YAML document — the single source of truth. */
  doc: Document;
  /** Called with a cloned, mutated document whenever a row edits a value. */
  onDocChange: (doc: Document) => void;
  planFeatureConfig: FeatureConfig;
  /** Validation causes from the last PUT/preview, keyed by field jsonPointer. */
  fieldErrors: Map<string, ValidationErrorCause[]>;
  disabled?: boolean;
}

interface FieldSectionGroup {
  section: string;
  fields: FieldDef[];
}

const UNSECTIONED = "Other";

/** Groups the registry by `section`, preserving first-seen order — pure display grouping. */
function groupBySection(fields: FieldDef[]): FieldSectionGroup[] {
  const groups: FieldSectionGroup[] = [];
  const bySection = new Map<string, FieldSectionGroup>();
  for (const field of fields) {
    const section = field.section ?? UNSECTIONED;
    let group = bySection.get(section);
    if (!group) {
      group = { section, fields: [] };
      bySection.set(section, group);
      groups.push(group);
    }
    group.fields.push(field);
  }
  return groups;
}

/**
 * `Document#getIn` unwraps scalars but returns collections (arrays/maps) as
 * their raw YAML nodes — convert those to plain JS so controls can treat
 * `getIn` results the same as `effective_*_feature_config` JSON values.
 */
function unwrapNode(v: unknown): unknown {
  return isCollection(v) ? v.toJSON() : v;
}

const FeatureConfigTableView: React.VFC<FeatureConfigTableViewProps> =
  function FeatureConfigTableView({
    doc,
    onDocChange,
    planFeatureConfig,
    fieldErrors,
    disabled,
  }) {
    const commit = useCallback(
      (field: FieldDef, value: unknown) => {
        const path = parseJsonPointer(field.jsonPointer);
        const next = doc.clone();
        if (value === undefined) {
          deleteAndPruneIn(next, path);
        } else {
          next.setIn(path, value);
        }
        onDocChange(next);
      },
      [doc, onDocChange]
    );

    const renderAppConfigCell = useCallback(
      (field: FieldDef) => {
        const path = parseJsonPointer(field.jsonPointer);
        const currentValue = unwrapNode(doc.getIn(path));
        const planValue = getAtPointer(planFeatureConfig, field.jsonPointer);

        switch (field.control) {
          case "boolean":
            return (
              <BooleanFieldControl
                value={
                  currentValue === undefined ? undefined : Boolean(currentValue)
                }
                planValue={planValue}
                disabled={disabled}
                onChange={(v) => commit(field, v)}
              />
            );
          case "number":
            return (
              <NumberFieldControl
                value={
                  currentValue === undefined ? undefined : Number(currentValue)
                }
                planValue={planValue}
                disabled={disabled}
                onChange={(v) => commit(field, v)}
              />
            );
          case "countryList":
            return (
              <CountryListFieldControl
                value={
                  currentValue === undefined
                    ? undefined
                    : (currentValue as string[])
                }
                disabled={disabled}
                onChange={(v) => commit(field, v)}
              />
            );
          case "usageLimitList":
            return (
              <UsageLimitListFieldControl
                value={
                  currentValue === undefined
                    ? undefined
                    : (currentValue as UsageLimitRule[])
                }
                disabled={disabled}
                onChange={(v) => commit(field, v)}
              />
            );
          default:
            return null;
        }
      },
      [doc, planFeatureConfig, disabled, commit]
    );

    const groups = useMemo(() => groupBySection(FIELD_REGISTRY), []);

    return (
      <Table.Root variant="surface" size="1" className={styles.cmpTable}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell className={styles.tableColSetting}>
              Setting
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className={styles.tableColDescription}>
              What it controls
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className={styles.tableColPlan}>
              📋 Plan Config
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>✏️ App Config</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {groups.map((group) => (
            <React.Fragment key={group.section}>
              <Table.Row>
                <Table.Cell colSpan={4} className={styles.sectionHeaderRow}>
                  {group.section}
                  {SECTION_DESCRIPTIONS[group.section] != null && (
                    <div className={styles.sectionDescription}>
                      {SECTION_DESCRIPTIONS[group.section]}
                    </div>
                  )}
                </Table.Cell>
              </Table.Row>
              {group.fields.map((field) => {
                const errors = fieldErrors.get(field.jsonPointer);
                const hasError = errors != null && errors.length > 0;
                return (
                  <Table.Row
                    key={field.jsonPointer}
                    align="center"
                    className={cn(hasError && styles.rowError)}
                  >
                    <Table.RowHeaderCell
                      className={cn(styles.tableCell, styles.tableCellLabel)}
                    >
                      <div className={styles.fieldLabelRow}>
                        <span>{field.label}</span>
                        {hasError && (
                          <Tooltip
                            content={errors
                              .map(
                                (e) =>
                                  e.kind +
                                  (e.details
                                    ? ` (${JSON.stringify(e.details)})`
                                    : "")
                              )
                              .join("; ")}
                          >
                            <span
                              className={styles.errorIcon}
                              tabIndex={0}
                              role="img"
                              aria-label="Validation error"
                            >
                              <CrossCircledIcon />
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      <div className={styles.jsonPath}>{field.jsonPointer}</div>
                    </Table.RowHeaderCell>
                    <Table.Cell
                      className={cn(styles.tableCell, styles.fieldDescription)}
                    >
                      {field.description}
                    </Table.Cell>
                    <Table.Cell className={styles.tableCell}>
                      <span className={styles.planValue}>
                        {formatDisplayValue(
                          field.control,
                          getAtPointer(planFeatureConfig, field.jsonPointer)
                        )}
                      </span>
                    </Table.Cell>
                    <Table.Cell className={styles.tableCell}>
                      {renderAppConfigCell(field)}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </React.Fragment>
          ))}
        </Table.Body>
      </Table.Root>
    );
  };

export default FeatureConfigTableView;
