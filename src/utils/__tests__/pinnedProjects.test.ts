import { act, renderHook } from "@testing-library/react";
import {
  PINNED_PROJECTS_STORAGE_KEY,
  getPinnedProjects,
  parsePinnedProjects,
  pinProject,
  unpinProject,
  usePinnedProjects,
} from "../pinnedProjects";

beforeEach(() => {
  window.localStorage.clear();
});

describe("parsePinnedProjects", () => {
  it("returns an empty list for missing or malformed values", () => {
    expect(parsePinnedProjects(null)).toEqual([]);
    expect(parsePinnedProjects("not json")).toEqual([]);
    expect(parsePinnedProjects('{"a":1}')).toEqual([]);
  });

  it("keeps non-empty strings and drops duplicates", () => {
    expect(parsePinnedProjects('["a", 1, "", "b", "a", null]')).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("pinProject / unpinProject", () => {
  it("appends in pin order and persists to localStorage", () => {
    pinProject("alpha");
    pinProject("beta");
    pinProject("alpha");
    expect(getPinnedProjects()).toEqual(["alpha", "beta"]);
    expect(window.localStorage.getItem(PINNED_PROJECTS_STORAGE_KEY)).toBe(
      '["alpha","beta"]'
    );
  });

  it("removes a pinned project", () => {
    pinProject("alpha");
    pinProject("beta");
    unpinProject("alpha");
    expect(getPinnedProjects()).toEqual(["beta"]);
  });

  it("returns a stable snapshot until the stored value changes", () => {
    pinProject("alpha");
    const first = getPinnedProjects();
    expect(getPinnedProjects()).toBe(first);
    pinProject("beta");
    expect(getPinnedProjects()).not.toBe(first);
  });
});

describe("usePinnedProjects", () => {
  it("re-renders when a project is pinned or unpinned", () => {
    const { result } = renderHook(() => usePinnedProjects());
    expect(result.current.pinned).toEqual([]);

    act(() => result.current.toggle("alpha"));
    expect(result.current.pinned).toEqual(["alpha"]);
    expect(result.current.isPinned("alpha")).toBe(true);

    act(() => result.current.toggle("alpha"));
    expect(result.current.isPinned("alpha")).toBe(false);
  });
});
