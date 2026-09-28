"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { EmptyState } from "@/components/empty-state";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { SoftImage as Image } from "@/components/soft-image";
import { BLUR_DATA_URL, isGif } from "@/lib/media";
import { entranceStyle } from "@/lib/motion";
import type { api } from "../../../convex/_generated/api";

export function FriendsClient({
  preloadedFriends,
}: {
  preloadedFriends: Preloaded<typeof api.friends.list>;
}) {
  const friends = usePreloadedQuery(preloadedFriends);

  const sortedFriends = [...friends].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8 animate-fade-in">
        {/* Header + intro */}
        <div className="space-y-4">
          <PageHeader
            path="/friends"
            title="friends"
            subtitle="people i think are cool"
            count={friends?.length}
            countLabel="people"
          />
        </div>

        {friends.length === 0 ? (
          <EmptyState message="no friends added yet" />
        ) : (
          <div className="friends-grid">
            {sortedFriends.map((friend, index) => (
              <div
                key={friend._id}
                className="mb-4 p-5 tcard enter-item"
                style={entranceStyle(index)}
              >
                <div className="flex items-start gap-4">
                  {friend.imageUrl ? (
                    <div className="relative w-16 h-16 shrink-0">
                      <Image
                        loading={index < 4 ? "eager" : "lazy"}
                        src={friend.imageUrl}
                        alt={friend.name}
                        fill
                        className="rounded-full object-cover border border-border"
                        sizes="64px"
                        unoptimized={isGif(friend.imageUrl)}
                        placeholder={isGif(friend.imageUrl) ? "empty" : "blur"}
                        blurDataURL={BLUR_DATA_URL}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-background border-2 border-border flex items-center justify-center text-rose text-xl font-bold shrink-0">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg">{friend.name}</h3>
                    {friend.content && (
                      <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        <Markdown content={friend.content} />
                      </div>
                    )}
                    {friend.links && friend.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {friend.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="friend-link"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
