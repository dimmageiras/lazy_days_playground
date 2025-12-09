import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FC } from "react";
import { useState } from "react";
import { describe, vi } from "vitest";

import { useClickOutside } from "./useClickOutside";

interface UseClickOutsideProps {
  handler: Parameters<typeof useClickOutside>[0];
  events?: Parameters<typeof useClickOutside>[1];
  nodes?: Parameters<typeof useClickOutside>[2];
}

const Target: FC<UseClickOutsideProps> = ({ handler, events, nodes }) => {
  const ref = useClickOutside<HTMLDivElement>(handler, events, nodes);

  return <div data-testid="target" ref={ref} tabIndex={-1} />;
};

describe("useClickOutside", (it) => {
  it("calls `handler` function when clicked outside target (no `events` given)", async ({
    expect,
  }) => {
    const handler = vi.fn();

    render(
      <>
        <Target handler={handler} />
        <div data-testid="outside-target" />
      </>
    );

    const target = screen.getByTestId("target");
    const outsideTarget = screen.getByTestId("outside-target");

    expect(handler).toHaveBeenCalledTimes(0);

    await userEvent.click(target);
    expect(handler).toHaveBeenCalledTimes(0);

    await userEvent.click(outsideTarget);
    expect(handler).toHaveBeenCalledTimes(1);

    await userEvent.click(outsideTarget);
    expect(handler).toHaveBeenCalledTimes(2);

    await userEvent.click(target);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("calls `handler` only on given `events`", async ({ expect }) => {
    const handler = vi.fn();
    const events = ["keydown"];

    render(
      <>
        <Target handler={handler} events={events} />
        <div data-testid="outside-target" />
      </>
    );

    const target = screen.getByTestId("target");
    const outsideTarget = screen.getByTestId("outside-target");

    await userEvent.click(target);
    await userEvent.click(outsideTarget);
    expect(handler).toHaveBeenCalledTimes(0);

    await userEvent.type(target, "{enter}");
    await userEvent.type(outsideTarget, "{enter}");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("ignores clicks outside the given `nodes`", async ({ expect }) => {
    const handler = vi.fn();

    const Wrapper: FC = () => {
      const [ignore, setIgnore] = useState<HTMLDivElement | null>(null);

      return (
        <>
          <Target handler={handler} nodes={[ignore]} />
          <div data-testid="ignore-clicks" ref={setIgnore} />
        </>
      );
    };

    render(
      <div>
        <Wrapper />
      </div>
    );

    const ignoreClicks = screen.getByTestId("ignore-clicks");

    await userEvent.click(ignoreClicks);
    expect(handler).toHaveBeenCalledTimes(0);

    const target = screen.getByTestId("target");

    await userEvent.click(target);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports default `mousedown` and `touchstart` events", async ({
    expect,
  }) => {
    const handler = vi.fn();

    render(
      <>
        <Target handler={handler} />
        <div data-testid="outside-target" />
      </>
    );

    const outsideTarget = screen.getByTestId("outside-target");

    await userEvent.click(outsideTarget);
    expect(handler).toHaveBeenCalledTimes(1);

    fireEvent.touchStart(outsideTarget);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("stops handling events after unmount", async ({ expect }) => {
    const handler = vi.fn();
    const outsideTarget = document.createElement("div");

    document.body.appendChild(outsideTarget);

    const { unmount } = render(<Target handler={handler} />);

    await userEvent.click(outsideTarget);
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();

    await userEvent.click(outsideTarget);
    expect(handler).toHaveBeenCalledTimes(1);

    outsideTarget.remove();
  });

  it("ignores events whose targets are not HTMLElements", ({ expect }) => {
    const handler = vi.fn();

    render(<Target handler={handler} />);

    document.dispatchEvent(new Event("mousedown"));

    expect(handler).toHaveBeenCalledTimes(0);
  });

  it("propagates event to handler", async ({ expect }) => {
    const handler = vi.fn();

    render(
      <>
        <Target handler={handler} />
        <div data-testid="outside-target" />
      </>
    );

    const outsideTarget = screen.getByTestId("outside-target");

    await userEvent.click(outsideTarget);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent));

    const event = handler.mock.calls[0]![0];

    expect(event).toHaveProperty("type", "mousedown");
    expect(event).toHaveProperty("target", outsideTarget);
  });
});
