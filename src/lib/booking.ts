export const BOOKING_URL = "https://cal.com/tetraslam/30min";

type CalApi = Awaited<
  ReturnType<typeof import("@calcom/embed-react").getCalApi>
>;
let api: Promise<CalApi> | undefined;
let preloaded = false;
let opening: Promise<void> | undefined;

export function openBooking() {
  if (opening) return opening;
  opening = (async () => {
    api ??= import("@calcom/embed-react").then(({ getCalApi }) =>
      getCalApi({ namespace: "30min" }),
    );
    const cal = await api;
    const theme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    const brand = getComputedStyle(document.documentElement)
      .getPropertyValue("--rose-deep")
      .trim();
    cal("ui", {
      theme,
      cssVarsPerTheme: {
        light: { "cal-brand": brand },
        dark: { "cal-brand": brand },
      },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
    // Cal's preload path owns a reusable modal instead of retaining one per click.
    if (!preloaded) {
      cal("preload", { calLink: "tetraslam/30min", type: "modal" });
      preloaded = true;
    }
    cal("modal", {
      calLink: "tetraslam/30min",
      config: { layout: "month_view", theme },
    });
  })()
    .catch(() => {
      api = undefined;
      preloaded = false;
      window.location.assign(BOOKING_URL);
    })
    .finally(() => {
      opening = undefined;
    });
  return opening;
}
