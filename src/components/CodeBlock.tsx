import React, { useCallback, useState } from "react";
import ControlledEditor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { IconButton } from "@fluentui/react";
import cn from "classnames";
import styles from "./CodeBlock.module.css";

const CODE_BLOCK_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  minimap: { enabled: false },
  wordWrap: "on",
  wrappingIndent: "deepIndent",
  renderLineHighlight: "none",
};

interface CopyButtonProps {
  value: string;
}

const CopyButton: React.VFC<CopyButtonProps> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const onClick = useCallback(() => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <div className={styles.copyButton}>
      <IconButton
        iconProps={{ iconName: copied ? "CheckMark" : "Copy" }}
        title="Copy"
        ariaLabel="Copy"
        onClick={onClick}
        styles={{
          root: { color: "#605e5c" },
          rootHovered: { color: "#323130", backgroundColor: "#edebe9" },
        }}
      />
    </div>
  );
};

export interface CodeBlockProps {
  className?: string;
  value?: string;
  language?: string;
}

const CodeBlock: React.VFC<CodeBlockProps> = function CodeBlock({
  className,
  value,
  language,
}) {
  const [mounted, setMounted] = useState(false);
  const onMount = useCallback(() => setMounted(true), []);

  return (
    <div className={cn(styles.root, className)}>
      {mounted && <CopyButton value={value ?? ""} />}
      <ControlledEditor
        height="100%"
        value={value}
        onMount={onMount}
        language={language}
        options={CODE_BLOCK_OPTIONS}
      />
    </div>
  );
};

export default CodeBlock;
