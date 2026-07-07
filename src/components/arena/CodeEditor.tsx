"use client";

import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import type { ExecutionLanguage } from "@/types/execution";
import { JUDGE0_LANGUAGE_MAP } from "@/types/execution";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const SOLVEX_THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment",      foreground: "2A4A3A", fontStyle: "italic" },
    { token: "comment.line", foreground: "2A4A3A", fontStyle: "italic" },
    { token: "keyword",      foreground: "569CD6" },
    { token: "string",       foreground: "CE9178" },
    { token: "number",       foreground: "B5CEA8" },
    { token: "type",         foreground: "4EC9B0" },
    { token: "function",     foreground: "DCDCAA" },
    { token: "variable",     foreground: "9CDCFE" },
    { token: "operator",     foreground: "D4D4D4" },
    { token: "delimiter",    foreground: "D4D4D4" },
    { token: "macro",        foreground: "C586C0" },
    { token: "class",        foreground: "4EC9B0" },
    { token: "namespace",    foreground: "4EC9B0" },
    { token: "include",      foreground: "C586C0" },
    { token: "preprocessor", foreground: "C586C0" },
  ],
  colors: {
    "editor.background":                    "#030E08",
    "editor.foreground":                    "#E0EDE8",
    "editor.lineHighlightBackground":       "#07140A",
    "editor.lineHighlightBorder":           "#00000000",
    "editor.selectionBackground":           "#00F5A022",
    "editor.inactiveSelectionBackground":   "#00F5A010",
    "editorLineNumber.foreground":          "#1A3A28",
    "editorLineNumber.activeForeground":    "#3A7A58",
    "editor.selectionHighlightBackground":  "#00F5A010",
    "editorCursor.foreground":              "#00F5A0",
    "editorIndentGuide.background1":        "#0C1E14",
    "editorIndentGuide.activeBackground1":  "#162B1E",
    "editor.findMatchBackground":           "#00F5A030",
    "editor.findMatchHighlightBackground":  "#00F5A018",
    "editorWidget.background":              "#060F08",
    "editorWidget.border":                  "rgba(0,245,160,0.12)",
    "editorSuggestWidget.background":       "#060F08",
    "editorSuggestWidget.border":           "rgba(0,245,160,0.12)",
    "editorSuggestWidget.selectedBackground":"#00F5A018",
    "editorSuggestWidget.foreground":       "#E0EDE8",
    "editorSuggestWidget.highlightForeground": "#00F5A0",
    "input.background":                     "#060F08",
    "input.border":                         "rgba(0,245,160,0.12)",
    "input.foreground":                     "#E0EDE8",
    "scrollbar.shadow":                     "#00000060",
    "scrollbarSlider.background":           "rgba(0,245,160,0.06)",
    "scrollbarSlider.hoverBackground":      "rgba(0,245,160,0.12)",
    "scrollbarSlider.activeBackground":     "rgba(0,245,160,0.25)",
    "editorBracketMatch.background":        "#00F5A015",
    "editorBracketMatch.border":            "rgba(0,245,160,0.5)",
  },
};

interface CodeEditorProps {
  language: ExecutionLanguage;
  value: string;
  onChange: (value: string) => void;
  onMount?: (editorInstance: editor.IStandaloneCodeEditor) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ language, value, onChange, onMount, readOnly }: CodeEditorProps) {
  const monacoLanguage = JUDGE0_LANGUAGE_MAP[language]?.monaco_language ?? "plaintext";

  function handleBeforeMount(monaco: typeof import("monaco-editor")) {
    monaco.editor.defineTheme("solvex-dark", SOLVEX_THEME);
  }

  function handleMount(editorInstance: editor.IStandaloneCodeEditor) {
    onMount?.(editorInstance);
    editorInstance.focus();
  }

  return (
    <div style={{ height: "100%", width: "100%", overflow: "hidden" }}>
      <MonacoEditor
        height="100%"
        language={monacoLanguage}
        value={value}
        theme="solvex-dark"
        beforeMount={handleBeforeMount as never}
        onMount={handleMount as never}
        onChange={(v) => onChange(v ?? "")}
        options={{
          fontSize: 14,
          lineHeight: 22,
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Menlo", monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: "off",
          readOnly: readOnly ?? false,
          cursorStyle: "line",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          lineNumbers: "on",
          glyphMargin: false,
          folding: true,
          foldingHighlight: false,
          renderLineHighlight: "line",
          renderWhitespace: "none",
          bracketPairColorization: { enabled: true },
          guides: { indentation: true, bracketPairs: false },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          contextmenu: true,
          quickSuggestions: { other: true, comments: false, strings: false },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          tabCompletion: "on",
          wordBasedSuggestions: "allDocuments",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  );
}
