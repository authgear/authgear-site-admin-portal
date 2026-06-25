import React from "react";
import ControlledEditor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import cn from "classnames";
import styles from "./CodeBlock.module.css";

const CODE_BLOCK_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  minimap: { enabled: false },
  wordWrap: "on",
  wrappingIndent: "deepIndent",
  renderLineHighlight: "none",
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
  return (
    <div className={cn(styles.root, className)}>
      <ControlledEditor
        height="100%"
        value={value}
        language={language}
        options={CODE_BLOCK_OPTIONS}
      />
    </div>
  );
};

export default CodeBlock;
