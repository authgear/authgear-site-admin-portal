import { useCallback, useSyncExternalStore } from "react";

// Pinned project IDs live in this browser's localStorage only; they are a
// per-viewer convenience for the sidebar, not server state.
export const PINNED_PROJECTS_STORAGE_KEY = "siteadmin.pinnedProjects";

const EMPTY: readonly string[] = Object.freeze([]);

type Listener = () => void;
const listeners = new Set<Listener>();

// Cache the parsed value so useSyncExternalStore gets a stable snapshot.
let cachedRaw: string | null | undefined;
let cachedValue: readonly string[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(PINNED_PROJECTS_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return null;
  }
}

export function parsePinnedProjects(raw: string | null): readonly string[] {
  if (raw == null) {
    return EMPTY;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return EMPTY;
    }
    const ids = parsed.filter(
      (v): v is string => typeof v === "string" && v !== ""
    );
    return Array.from(new Set(ids));
  } catch {
    return EMPTY;
  }
}

export function getPinnedProjects(): readonly string[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parsePinnedProjects(raw);
  }
  return cachedValue;
}

function write(ids: readonly string[]): void {
  try {
    window.localStorage.setItem(
      PINNED_PROJECTS_STORAGE_KEY,
      JSON.stringify(ids)
    );
  } catch {
    // Ignore: pinning just won't persist.
  }
  listeners.forEach((l) => l());
}

export function pinProject(id: string): void {
  const current = getPinnedProjects();
  if (current.includes(id)) {
    return;
  }
  write([...current, id]);
}

export function unpinProject(id: string): void {
  const current = getPinnedProjects();
  if (!current.includes(id)) {
    return;
  }
  write(current.filter((p) => p !== id));
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  // Keep other tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === PINNED_PROJECTS_STORAGE_KEY || e.key === null) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export interface PinnedProjects {
  pinned: readonly string[];
  isPinned: (id: string) => boolean;
  pin: (id: string) => void;
  unpin: (id: string) => void;
  toggle: (id: string) => void;
}

export function usePinnedProjects(): PinnedProjects {
  const pinned = useSyncExternalStore(
    subscribe,
    getPinnedProjects,
    () => EMPTY
  );
  const isPinned = useCallback((id: string) => pinned.includes(id), [pinned]);
  const toggle = useCallback(
    (id: string) => (pinned.includes(id) ? unpinProject(id) : pinProject(id)),
    [pinned]
  );
  return { pinned, isPinned, pin: pinProject, unpin: unpinProject, toggle };
}
