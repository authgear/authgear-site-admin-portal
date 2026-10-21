import React, { useCallback, useMemo, useRef, useState } from "react";
import { SegmentedControl } from "@radix-ui/themes";
import { Document, parseDocument } from "yaml";
import NavigationBlockerDialog from "../components/NavigationBlockerDialog";
import ShowLoading from "../components/ShowLoading";
import { Callout } from "../components/v2/Callout/Callout";
import { PrimaryButton } from "../components/v2/Button/PrimaryButton/PrimaryButton";
import { SecondaryButton } from "../components/v2/Button/SecondaryButton/SecondaryButton";
import useFeatureConfigDraft from "./featureConfig/useFeatureConfigDraft";
import FeatureConfigTableView from "./featureConfig/FeatureConfigTableView";
import FeatureConfigYamlView from "./featureConfig/FeatureConfigYamlView";
import { documentToYamlText } from "./featureConfig/yamlDocumentEdits";
import styles from "./FeatureConfigContent.module.css";

export interface FeatureConfigContentProps {
  appId: string;
}

type ViewMode = "table" | "yaml";

const FeatureConfigContent: React.VFC<FeatureConfigContentProps> =
  function FeatureConfigContent({ appId }) {
    const draft = useFeatureConfigDraft(appId);
    const [view, setView] = useState<ViewMode>("table");

    // Read fresh at the moment a navigation is attempted, not captured
    // stale from the render that mounted NavigationBlockerDialog -- draft.save()
    // clears dirtiness asynchronously on API response, and a save-then-navigate
    // sequence must not show a spurious dialog.
    const dirtyRef = useRef(draft.dirty);
    dirtyRef.current = draft.dirty;
    const getIsDirty = useCallback(() => dirtyRef.current, []);

    const parsedDoc: Document | null = useMemo(() => {
      try {
        return parseDocument(draft.yamlText);
      } catch {
        return null;
      }
    }, [draft.yamlText]);

    const parseError =
      parsedDoc == null
        ? "Failed to parse YAML."
        : parsedDoc.errors.length > 0
          ? parsedDoc.errors[0].message
          : null;

    // Table -> YAML is always safe; YAML -> table requires parseable YAML
    // since the table view reads the document directly.
    const onSelectView = useCallback(
      (mode: ViewMode) => {
        if (mode === "table" && parseError != null) return;
        setView(mode);
      },
      [parseError]
    );

    const onViewValueChange = useCallback(
      (value: string) => {
        onSelectView(value as ViewMode);
      },
      [onSelectView]
    );

    const onDocChange = useCallback(
      (nextDoc: Document) => {
        draft.setYamlText(documentToYamlText(nextDoc));
      },
      [draft]
    );

    if (draft.loading) {
      return (
        <div className={styles.loadingRoot}>
          <ShowLoading />
        </div>
      );
    }

    if (draft.loadError) {
      return (
        <Callout type="error" text={draft.loadError} showCloseButton={false} />
      );
    }

    return (
      <>
        {/* Rendered outside .root so the dialog never becomes an extra flex
            item in .root's gapped column and shifts everything below it. */}
        <NavigationBlockerDialog getIsDirty={getIsDirty} />
        <div className={styles.root}>
          <div className={styles.viewToggleRow}>
            <SegmentedControl.Root
              size="2"
              value={view}
              onValueChange={onViewValueChange}
            >
              <SegmentedControl.Item value="table">Table</SegmentedControl.Item>
              <SegmentedControl.Item value="yaml">YAML</SegmentedControl.Item>
            </SegmentedControl.Root>
          </div>

          {parseError && (
            <Callout type="error" text={parseError} showCloseButton={false} />
          )}
          {draft.errorMessage && (
            <Callout
              type="error"
              text={draft.errorMessage}
              showCloseButton={false}
            />
          )}
          {draft.saveSuccess && (
            <Callout
              type="success"
              text="Feature config saved."
              showCloseButton={false}
            />
          )}

          {view === "table" && parsedDoc && parseError == null && (
            <FeatureConfigTableView
              doc={parsedDoc}
              onDocChange={onDocChange}
              planFeatureConfig={draft.effectivePlan ?? {}}
              fieldErrors={draft.validationCauses ?? new Map()}
              disabled={draft.saving}
            />
          )}

          {view === "yaml" && (
            <FeatureConfigYamlView
              yamlText={draft.yamlText}
              onYamlTextChange={draft.setYamlText}
              onEditorBlur={draft.triggerPreviewNow}
              planName={draft.planName}
              planFeatureConfig={draft.effectivePlan ?? {}}
              effectiveFeatureConfig={draft.effective ?? {}}
              disabled={draft.saving}
            />
          )}

          <div className={styles.actionBar}>
            <SecondaryButton
              size="2"
              text="Discard"
              onClick={draft.discard}
              disabled={!draft.dirty || draft.saving}
            />
            <PrimaryButton
              size="2"
              text={draft.saving ? "Saving…" : "Save"}
              onClick={draft.save}
              disabled={!draft.dirty || draft.saving || parseError != null}
            />
          </div>
        </div>
      </>
    );
  };

export default FeatureConfigContent;
