import { useQuery } from "@tanstack/react-query";
import { Bell, LogIn, LogOut, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import {
  type NotificationEvent,
  Variant_checkIn_checkOut,
} from "../../backend.d";
import { useActor } from "../../hooks/useActor";

function formatNanoTimestamp(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function NotificationItem({
  event,
  index,
}: { event: NotificationEvent; index: number }) {
  const isCheckIn = event.eventType === Variant_checkIn_checkOut.checkIn;

  return (
    <motion.div
      data-ocid={`notifications.item.${index + 1}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="flex items-start gap-4 rounded-xl p-4"
      style={{
        background: "oklch(0.13 0.006 60)",
        border: `1px solid ${isCheckIn ? "oklch(0.68 0.18 148 / 0.2)" : "oklch(0.60 0.22 22 / 0.2)"}`,
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isCheckIn
            ? "oklch(0.68 0.18 148 / 0.15)"
            : "oklch(0.60 0.22 22 / 0.15)",
          border: `1px solid ${isCheckIn ? "oklch(0.68 0.18 148 / 0.3)" : "oklch(0.60 0.22 22 / 0.3)"}`,
        }}
      >
        {isCheckIn ? (
          <LogIn
            className="w-4 h-4"
            style={{ color: "oklch(0.68 0.18 148)" }}
          />
        ) : (
          <LogOut
            className="w-4 h-4"
            style={{ color: "oklch(0.65 0.22 22)" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-semibold text-sm text-foreground">
            {event.staffName}
          </span>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: isCheckIn
                ? "oklch(0.68 0.18 148 / 0.12)"
                : "oklch(0.60 0.22 22 / 0.12)",
              color: isCheckIn ? "oklch(0.68 0.18 148)" : "oklch(0.65 0.22 22)",
              border: `1px solid ${isCheckIn ? "oklch(0.68 0.18 148 / 0.25)" : "oklch(0.60 0.22 22 / 0.25)"}`,
            }}
          >
            {isCheckIn ? "Check In" : "Check Out"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{event.message}</p>
        <p className="text-xs mt-1.5" style={{ color: "oklch(0.50 0.008 70)" }}>
          {formatNanoTimestamp(event.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}

export default function NotificationsTab() {
  const { actor, isFetching } = useActor();

  const {
    data: notifications,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery<NotificationEvent[]>({
    queryKey: ["recentNotifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentNotifications(20n);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });

  const sortedNotifications = (notifications ?? [])
    .slice()
    .sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gold" />
          <h2 className="font-display text-xl font-bold text-foreground">
            Activity Log
          </h2>
          {notifications && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium ml-1"
              style={{
                background: "oklch(0.76 0.15 85 / 0.12)",
                color: "oklch(0.76 0.15 85)",
                border: "1px solid oklch(0.76 0.15 85 / 0.25)",
              }}
            >
              {sortedNotifications.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>
            {dataUpdatedAt
              ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
              : "Auto-refresh every 30s"}
          </span>
        </button>
      </div>

      {/* Loading */}
      {(isLoading || isFetching) && (
        <div
          data-ocid="notifications.loading_state"
          className="flex justify-center py-12"
        >
          <div className="gold-spinner" />
        </div>
      )}

      {/* Notifications */}
      {!isLoading && (
        <div data-ocid="notifications.list">
          {sortedNotifications.length === 0 ? (
            <motion.div
              data-ocid="notifications.empty_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
              style={{
                border: "1px dashed oklch(0.28 0.010 70)",
                borderRadius: "0.75rem",
              }}
            >
              <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="font-display text-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check-in and check-out events will appear here
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {sortedNotifications.map((event, i) => (
                <NotificationItem
                  key={String(event.id)}
                  event={event}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
