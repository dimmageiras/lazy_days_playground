import { renderHook } from "@testing-library/react";
import { describe, vi } from "vitest";

vi.mock("react-router");

import { useOutletContext } from "react-router";

import { IdUtilsHelper } from "@shared/helpers/id-utils.helper";

import { useCSPNonce } from "./useCSPNonce";

describe("useCSPNonce", (it) => {
  it("returns the CSP nonce from outlet context", ({ expect }) => {
    const { secureIdGen } = IdUtilsHelper;
    const cspNonce = secureIdGen();
    const mockContext = { cspNonce: cspNonce };

    vi.mocked(useOutletContext).mockReturnValue(mockContext);

    const { result } = renderHook(() => useCSPNonce());

    expect(result.current).toEqual(mockContext);
    expect(result.current.cspNonce).toBe(cspNonce);
    expect(vi.mocked(useOutletContext)).toHaveBeenCalledTimes(1);
  });

  it("returns undefined CSP nonce when context provides undefined", ({
    expect,
  }) => {
    const mockContext = { cspNonce: undefined };

    vi.mocked(useOutletContext).mockReturnValue(mockContext);

    const { result } = renderHook(() => useCSPNonce());

    expect(result.current).toEqual(mockContext);
    expect(result.current.cspNonce).toBeUndefined();
  });

  it("returns null CSP nonce when context provides null", ({ expect }) => {
    const mockContext = { cspNonce: null };

    vi.mocked(useOutletContext).mockReturnValue(mockContext);

    const { result } = renderHook(() => useCSPNonce());

    expect(result.current).toEqual(mockContext);
    expect(result.current.cspNonce).toBeNull();
  });

  it("returns empty string CSP nonce when context provides empty string", ({
    expect,
  }) => {
    const mockContext = { cspNonce: "" };

    vi.mocked(useOutletContext).mockReturnValue(mockContext);

    const { result } = renderHook(() => useCSPNonce());

    expect(result.current).toEqual(mockContext);
    expect(result.current.cspNonce).toBe("");
  });
});
