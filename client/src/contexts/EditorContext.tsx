"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface EditorContextType {
  activeEditorType: string | null;
  registerEditor: (type: string, actions: EditorActions) => void;
  unregisterEditor: () => void;
  dispatchAction: (action: string, payload?: any) => void;
}

interface EditorActions {
  createNewFile?: (name: string, type: string) => void;
  createNewFolder?: (name: string) => void;
}

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [activeEditorType, setActiveEditorType] = useState<string | null>(null);
  const [actions, setActions] = useState<EditorActions | null>(null);

  const registerEditor = useCallback((type: string, editorActions: EditorActions) => {
    setActiveEditorType(type);
    setActions(editorActions);
  }, []);

  const unregisterEditor = useCallback(() => {
    setActiveEditorType(null);
    setActions(null);
  }, []);

  const dispatchAction = useCallback((action: string, payload?: any) => {
    if (!actions) return;

    switch (action) {
      case "CREATE_FILE":
        actions.createNewFile?.(payload.name, payload.type);
        break;
      case "CREATE_FOLDER":
        actions.createNewFolder?.(payload.name);
        break;
      default:
        console.warn(`Action ${action} not supported by current editor`);
    }
  }, [actions]);

  return (
    <EditorContext.Provider value={{ activeEditorType, registerEditor, unregisterEditor, dispatchAction }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
}
