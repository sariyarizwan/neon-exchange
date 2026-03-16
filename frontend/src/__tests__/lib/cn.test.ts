import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("returns empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple truthy classes with a space", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("filters out false values", () => {
    expect(cn("foo", false, "bar")).toBe("foo bar");
  });

  it("filters out null values", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("filters out undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("handles all falsy values and returns empty string", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("handles mixed truthy and falsy values correctly", () => {
    expect(cn("a", false, "b", null, undefined, "c")).toBe("a b c");
  });
});
