// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";

const { cal, getCalApi } = vi.hoisted(() => ({
  cal: vi.fn(),
  getCalApi: vi.fn(),
}));
vi.mock("@calcom/embed-react", () => ({ getCalApi }));

afterEach(() => {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.removeProperty("--rose-deep");
  vi.resetAllMocks();
  vi.resetModules();
});

test("concurrent opens initialize one reusable modal and reopening uses the current theme", async () => {
  let ready: (api: typeof cal) => void = () => {};
  getCalApi.mockImplementation(
    () =>
      new Promise((resolve) => {
        ready = resolve;
      }),
  );
  document.documentElement.style.setProperty("--rose-deep", "#94634c");
  const { openBooking } = await import("../src/lib/booking");
  const first = openBooking();
  expect(openBooking()).toBe(first);
  await vi.waitFor(() => expect(getCalApi).toHaveBeenCalledTimes(1));
  ready(cal);
  await first;
  expect(cal).toHaveBeenCalledWith("preload", {
    calLink: "tetraslam/30min",
    type: "modal",
  });
  expect(cal).toHaveBeenLastCalledWith("modal", {
    calLink: "tetraslam/30min",
    config: { layout: "month_view", theme: "light" },
  });

  document.documentElement.classList.add("dark");
  await openBooking();
  expect(getCalApi).toHaveBeenCalledTimes(1);
  expect(
    cal.mock.calls.filter(([method]) => method === "preload"),
  ).toHaveLength(1);
  expect(cal.mock.calls.filter(([method]) => method === "modal")).toHaveLength(
    2,
  );
  expect(cal).toHaveBeenLastCalledWith("modal", {
    calLink: "tetraslam/30min",
    config: { layout: "month_view", theme: "dark" },
  });
});
