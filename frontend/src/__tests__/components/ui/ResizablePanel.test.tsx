import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResizablePanel } from "@/components/ui/ResizablePanel";

describe("ResizablePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders children", () => {
    render(
      <ResizablePanel initialWidth={300} initialHeight={200}>
        <div>Panel Content</div>
      </ResizablePanel>
    );
    expect(screen.getByText("Panel Content")).toBeInTheDocument();
  });

  it("applies initial width and height as styles", () => {
    const { container } = render(
      <ResizablePanel initialWidth={300} initialHeight={200}>
        <div>test</div>
      </ResizablePanel>
    );
    const panel = container.firstChild as HTMLElement;
    expect(panel.style.width).toBe("300px");
    expect(panel.style.height).toBe("200px");
  });

  it("has data-ignore-camera-keys attribute", () => {
    const { container } = render(
      <ResizablePanel initialWidth={300} initialHeight={200}>
        <div>test</div>
      </ResizablePanel>
    );
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveAttribute("data-ignore-camera-keys", "true");
  });

  it("renders 8 resize handles (4 edges + 4 corners)", () => {
    const { container } = render(
      <ResizablePanel initialWidth={300} initialHeight={200}>
        <div>test</div>
      </ResizablePanel>
    );
    // The panel container itself + 8 handles = 9 direct children
    const panel = container.firstChild as HTMLElement;
    // Children: content children + handles
    const allDivChildren = panel.querySelectorAll(":scope > div");
    // 1 for children content wrapper + 8 for handles = 9 total direct div children
    // But the content is whatever is passed, so we count handle-related divs
    // Handles have specific cursor classes
    const nsHandles = panel.querySelectorAll(".cursor-ns-resize");
    const ewHandles = panel.querySelectorAll(".cursor-ew-resize");
    const neswHandles = panel.querySelectorAll(".cursor-nesw-resize");
    const nwseHandles = panel.querySelectorAll(".cursor-nwse-resize");
    expect(nsHandles.length).toBe(2); // n + s
    expect(ewHandles.length).toBe(2); // e + w
    expect(neswHandles.length).toBe(2); // ne + sw
    expect(nwseHandles.length).toBe(2); // nw + se
  });

  it("reads stored size from localStorage when storageKey is provided", () => {
    localStorage.setItem("test-panel", JSON.stringify({ width: 500, height: 400 }));
    const { container } = render(
      <ResizablePanel initialWidth={300} initialHeight={200} storageKey="test-panel">
        <div>test</div>
      </ResizablePanel>
    );
    const panel = container.firstChild as HTMLElement;
    expect(panel.style.width).toBe("500px");
    expect(panel.style.height).toBe("400px");
  });

  it("falls back to initialWidth/Height when localStorage has no entry", () => {
    const { container } = render(
      <ResizablePanel initialWidth={350} initialHeight={250} storageKey="no-entry-panel">
        <div>test</div>
      </ResizablePanel>
    );
    const panel = container.firstChild as HTMLElement;
    expect(panel.style.width).toBe("350px");
    expect(panel.style.height).toBe("250px");
  });

  it("falls back to initialWidth/Height when localStorage has corrupt data", () => {
    localStorage.setItem("corrupt-panel", "INVALID JSON");
    const { container } = render(
      <ResizablePanel initialWidth={300} initialHeight={200} storageKey="corrupt-panel">
        <div>test</div>
      </ResizablePanel>
    );
    const panel = container.firstChild as HTMLElement;
    expect(panel.style.width).toBe("300px");
    expect(panel.style.height).toBe("200px");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ResizablePanel initialWidth={300} initialHeight={200} className="my-custom-class">
        <div>test</div>
      </ResizablePanel>
    );
    const panel = container.firstChild as HTMLElement;
    expect(panel.className).toContain("my-custom-class");
  });

  it("renders multiple children", () => {
    render(
      <ResizablePanel initialWidth={300} initialHeight={200}>
        <div>Child 1</div>
        <div>Child 2</div>
        <span>Child 3</span>
      </ResizablePanel>
    );
    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
    expect(screen.getByText("Child 3")).toBeInTheDocument();
  });

  it("stores size to localStorage when storageKey is provided", () => {
    render(
      <ResizablePanel initialWidth={300} initialHeight={200} storageKey="save-test-panel">
        <div>test</div>
      </ResizablePanel>
    );
    const stored = localStorage.getItem("save-test-panel");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.width).toBe(300);
    expect(parsed.height).toBe(200);
  });
});
