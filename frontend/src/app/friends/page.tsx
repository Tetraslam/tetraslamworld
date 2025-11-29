"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function FriendsPage() {
  const friends = useQuery(api.friends.list);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">friends</h1>
          <p className="text-muted-foreground mt-1">
            people i think are cool
          </p>
        </div>

        {!friends ? (
          <div className="text-muted-foreground py-8 text-center">loading...</div>
        ) : friends.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            no friends added yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((friend) => (
                <div
                  key={friend._id}
                  className="p-4 bg-surface border border-border rounded hover:border-rose/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {friend.imageUrl && (
                      <img
                        src={friend.imageUrl}
                        alt={friend.name}
                        className="w-12 h-12 rounded-full object-cover border border-border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-rose">{friend.name}</h3>
                      {friend.content && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {friend.content}
                        </p>
                      )}
                      {friend.links && friend.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {friend.links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-rose-deep hover:text-rose"
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
