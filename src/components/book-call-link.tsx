"use client";

import { track } from "@vercel/analytics";
import { BOOKING_URL, openBooking } from "@/lib/booking";

export function BookCallLink() {
  return (
    <a
      href={BOOKING_URL}
      aria-haspopup="dialog"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        track("book_call_click", { source: "homepage" });
        void openBooking();
      }}
    >
      book a call
    </a>
  );
}
