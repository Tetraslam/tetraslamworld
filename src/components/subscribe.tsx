"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

export function Subscribe() {
  const [expanded, setExpanded] = useState(false);
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const emails = useQuery(
    api.emailList.list,
    isSignedIn && expanded ? {} : "skip",
  );
  const add = useMutation(api.emailList.add);
  const email = user?.primaryEmailAddress?.emailAddress;
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const pending = useRef(false);
  const subscribed =
    status === "success" ||
    emails?.some((entry) => entry.email === email?.toLowerCase());
  async function subscribe() {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (!email || pending.current) return;
    pending.current = true;
    setStatus("pending");
    try {
      await add({ emails: [email] });
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      pending.current = false;
    }
  }
  return (
    <div className="subscription">
      <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary>subscribe by email</summary>
        <div className="subscription-body">
          {subscribed ? (
            <p>you’re subscribed.</p>
          ) : (
            <>
              <p>
                {isSignedIn
                  ? email
                    ? `send new posts to ${email}.`
                    : "your account needs an email address to subscribe."
                  : "sign in to subscribe with your account’s email address."}
              </p>
              <button
                type="button"
                className="text-action"
                onClick={subscribe}
                disabled={status === "pending" || (isSignedIn && !email)}
              >
                {status === "pending"
                  ? "subscribing…"
                  : isSignedIn
                    ? "confirm subscription"
                    : "sign in to subscribe"}
              </button>
            </>
          )}
          <output>
            {status === "error"
              ? "couldn’t subscribe. please try again."
              : status === "success"
                ? "subscription confirmed."
                : ""}
          </output>
        </div>
      </details>
      <a href="https://blog.tetraslam.world/rss">rss</a>
    </div>
  );
}
