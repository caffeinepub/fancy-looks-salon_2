import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  UserCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { AttendanceRecord, StaffProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

/**
 * Convert backend epoch-days (UTC) string to a local Date object.
 * The backend stores epoch-days as UTC floor(timestamp / 86400s).
 * To correctly map this to a display date in any timezone, we use
 * UTC noon so that getUTCFullYear/getUTCMonth/getUTCDate always give
 * the correct UTC date, while toLocaleDateString uses the same Date
 * object for display.
 */
function epochDaysToDate(dateStr: string): Date {
  const epochDays = Number(dateStr);
  // UTC noon: safe from any timezone shift
  return new Date(epochDays * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000);
}

/**
 * Get today's epoch-days using the device's local date.
 * We compute local midnight in the device's timezone so the "today"
 * epoch-days matches what the device considers today.
 */
function getTodayEpochDays(): string {
  const now = new Date();
  // Create a date at local midnight
  const localMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return Math.floor(localMidnight.getTime() / (24 * 60 * 60 * 1000)).toString();
}

/**
 * Get epoch-days for a given local year/month (0-based)/day.
 */
function localDateToEpochDays(
  year: number,
  month: number,
  day: number,
): number {
  return Math.floor(
    new Date(year, month, day).getTime() / (24 * 60 * 60 * 1000),
  );
}

// Convert nanosecond bigint timestamp to formatted time string
function formatNanoTime(ns: bigint | undefined | null): string {
  if (ns == null) return "\u2014";
  return new Date(Number(ns) / 1_000_000).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Format a Date to weekday + date (using UTC date values to avoid timezone shift)
function formatDayHeader(d: Date): string {
  // Use the UTC date values since our epochDaysToDate uses UTC noon
  const utcDate = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  return utcDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Group records by date for monthly view
function groupByDate(
  records: AttendanceRecord[],
): Map<string, AttendanceRecord[]> {
  const map = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const existing = map.get(r.date) ?? [];
    existing.push(r);
    map.set(r.date, existing);
  }
  return map;
}

// Badge component
function StatusBadge({
  status,
}: { status: "present" | "checked-out" | "absent" }) {
  if (status === "present") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: "oklch(0.68 0.18 148 / 0.18)",
          color: "oklch(0.68 0.18 148)",
          border: "1px solid oklch(0.68 0.18 148 / 0.35)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.68_0.18_148)] animate-pulse" />
        Present
      </span>
    );
  }
  if (status === "checked-out") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: "oklch(0.78 0.16 52 / 0.15)",
          color: "oklch(0.78 0.16 52)",
          border: "1px solid oklch(0.78 0.16 52 / 0.35)",
        }}
      >
        Checked Out
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{
        background: "oklch(0.60 0.22 22 / 0.15)",
        color: "oklch(0.65 0.22 22)",
        border: "1px solid oklch(0.60 0.22 22 / 0.3)",
      }}
    >
      Absent
    </span>
  );
}

// ─── Daily View ────────────────────────────────────────────────────────────────────────────────
function DailyView({
  staffList,
  todayRecords,
}: {
  staffList: StaffProfile[];
  todayRecords: AttendanceRecord[];
}) {
  const today = new Date();
  const active = staffList.filter((s) => s.isActive);

  type StaffRow = {
    staff: StaffProfile;
    record: AttendanceRecord | undefined;
    status: "present" | "checked-out" | "absent";
  };

  const rows: StaffRow[] = active.map((s) => {
    // A staff can have multiple records today (re-check-in) — use the latest open one
    const allForStaff = todayRecords.filter(
      (a) => String(a.staffId) === String(s.id),
    );
    const openRecord = allForStaff.find(
      (r) => r.checkInTime != null && r.checkOutTime == null,
    );
    const latestCompleted = allForStaff
      .filter((r) => r.checkInTime != null && r.checkOutTime != null)
      .sort(
        (a, b) => Number(b.checkOutTime ?? 0n) - Number(a.checkOutTime ?? 0n),
      )[0];
    const r = openRecord ?? latestCompleted ?? allForStaff[0];
    let status: "present" | "checked-out" | "absent" = "absent";
    if (r?.checkInTime != null && r.checkOutTime == null) status = "present";
    else if (r?.checkInTime != null && r.checkOutTime != null)
      status = "checked-out";
    return { staff: s, record: r, status };
  });

  // Sort: present first, checked-out second, absent last
  const sorted = [
    ...rows.filter((r) => r.status === "present"),
    ...rows.filter((r) => r.status === "checked-out"),
    ...rows.filter((r) => r.status === "absent"),
  ];

  const presentCount = rows.filter((r) => r.status === "present").length;
  const checkedOutCount = rows.filter((r) => r.status === "checked-out").length;
  const absentCount = rows.filter((r) => r.status === "absent").length;

  return (
    <div className="space-y-4">
      {/* Date header */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-gold" />
        <span className="font-display text-lg font-semibold text-foreground">
          {today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            label: "Present",
            value: presentCount,
            color: "oklch(0.68 0.18 148)",
          },
          {
            label: "Checked Out",
            value: checkedOutCount,
            color: "oklch(0.78 0.16 52)",
          },
          { label: "Absent", value: absentCount, color: "oklch(0.65 0.22 22)" },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium"
            style={{
              background: `${s.color} / 0.12`,
              color: s.color,
              border: `1px solid ${s.color} / 0.3`,
            }}
          >
            <span className="font-bold text-sm" style={{ color: s.color }}>
              {s.value}
            </span>
            {s.label}
          </div>
        ))}
      </div>

      {/* Staff rows */}
      {sorted.length === 0 ? (
        <div
          data-ocid="staff_attendance.daily.empty_state"
          className="text-center py-10 text-muted-foreground"
        >
          <UserCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No active staff found.</p>
        </div>
      ) : (
        <div data-ocid="staff_attendance.daily.list" className="space-y-2">
          {sorted.map((row, i) => (
            <motion.div
              key={String(row.staff.id)}
              data-ocid={`staff_attendance.daily.item.${i + 1}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 luxury-card"
            >
              {/* Photo */}
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: "1.5px solid oklch(0.76 0.15 85 / 0.25)" }}
              >
                {row.staff.photoUrl ? (
                  <img
                    src={row.staff.photoUrl}
                    alt={row.staff.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.src = `https://i.pravatar.cc/150?img=${(Number(row.staff.id) % 70) + 1}`;
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: "oklch(0.20 0.012 80)" }}
                  >
                    <UserCircle2 className="w-5 h-5 text-gold opacity-50" />
                  </div>
                )}
              </div>

              {/* Name + shift */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {row.staff.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {row.staff.shiftStart} \u2013 {row.staff.shiftEnd}
                </p>
              </div>

              {/* Times */}
              <div className="flex flex-col items-end gap-1 text-[11px] text-muted-foreground min-w-[100px]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gold opacity-70" />
                  <span className="text-[10px] text-muted-foreground">In:</span>
                  <span
                    className="font-semibold"
                    style={{ color: "oklch(0.76 0.15 85)" }}
                  >
                    {formatNanoTime(row.record?.checkInTime)}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground opacity-50" />
                  <span className="text-[10px] text-muted-foreground">
                    Out:
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "oklch(0.85 0.01 80)" }}
                  >
                    {formatNanoTime(row.record?.checkOutTime)}
                  </span>
                </span>
              </div>

              {/* Status badge */}
              <StatusBadge status={row.status} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Monthly View ────────────────────────────────────────────────────────────────────────────────
function MonthlyView({
  staffList,
  allRecords,
}: {
  staffList: StaffProfile[];
  allRecords: AttendanceRecord[];
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const monthName = new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Filter records for the selected month using local date comparison.
  // We compare epoch-days ranges: find epoch-days for the first and last day
  // of the selected month in the device's local timezone.
  const monthStart = localDateToEpochDays(year, month, 1);
  // Last day of month: day 0 of next month = last day of this month
  const nextMonthFirst = new Date(year, month + 1, 1);
  const monthEnd = Math.floor(nextMonthFirst.getTime() / (24 * 60 * 60 * 1000)); // exclusive
  const monthRecords = allRecords.filter((r) => {
    const epochDay = Number(r.date);
    return epochDay >= monthStart && epochDay < monthEnd;
  });

  // Group by date
  const byDate = groupByDate(monthRecords);

  // Sort dates descending
  const sortedDates = [...byDate.keys()].sort((a, b) => Number(b) - Number(a));

  const activeStaff = staffList.filter((s) => s.isActive);
  const totalStaffDays = monthRecords.filter(
    (r) => r.checkInTime != null,
  ).length;

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          data-ocid="staff_attendance.monthly.pagination_prev"
          onClick={prevMonth}
          className="p-2 rounded-lg transition-colors hover:bg-[oklch(0.22_0.008_60)] text-muted-foreground hover:text-gold"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-display text-base font-semibold text-foreground">
            {monthName}
          </p>
          <p className="text-xs text-muted-foreground">
            {totalStaffDays} staff-day{totalStaffDays !== 1 ? "s" : ""} present
          </p>
        </div>
        <button
          type="button"
          data-ocid="staff_attendance.monthly.pagination_next"
          onClick={nextMonth}
          className="p-2 rounded-lg transition-colors hover:bg-[oklch(0.22_0.008_60)] text-muted-foreground hover:text-gold"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days */}
      {sortedDates.length === 0 ? (
        <div
          data-ocid="staff_attendance.monthly.empty_state"
          className="text-center py-10 text-muted-foreground"
        >
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No attendance records for this month.</p>
        </div>
      ) : (
        <div data-ocid="staff_attendance.monthly.list" className="space-y-3">
          {sortedDates.map((dateStr, di) => {
            const dayRecords = byDate.get(dateStr) ?? [];
            const dayDate = epochDaysToDate(dateStr);
            const isToday = dateStr === getTodayEpochDays();

            return (
              <motion.div
                key={dateStr}
                data-ocid={`staff_attendance.monthly.item.${di + 1}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.04, duration: 0.3 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "oklch(0.16 0.006 60)",
                  border: isToday
                    ? "1px solid oklch(0.76 0.15 85 / 0.4)"
                    : "1px solid oklch(0.22 0.008 60)",
                }}
              >
                {/* Day header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{
                    background: isToday
                      ? "oklch(0.76 0.15 85 / 0.08)"
                      : "oklch(0.14 0.006 60)",
                    borderBottom: "1px solid oklch(0.22 0.008 60)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gold" />
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: isToday
                          ? "oklch(0.76 0.15 85)"
                          : "oklch(0.85 0.01 80)",
                      }}
                    >
                      {formatDayHeader(dayDate)}
                    </span>
                    {isToday && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "oklch(0.76 0.15 85 / 0.2)",
                          color: "oklch(0.76 0.15 85)",
                        }}
                      >
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {dayRecords.filter((r) => r.checkInTime != null).length}{" "}
                    present
                  </span>
                </div>

                {/* Staff rows for this day */}
                <div
                  className="divide-y"
                  style={{ borderColor: "oklch(0.20 0.008 60)" }}
                >
                  {dayRecords.map((record) => {
                    const staff = activeStaff.find(
                      (s) => String(s.id) === String(record.staffId),
                    );
                    const name = staff?.name ?? `Staff #${record.staffId}`;
                    const photoUrl = staff?.photoUrl ?? "";

                    let status: "present" | "checked-out" | "absent" = "absent";
                    if (
                      record.checkInTime != null &&
                      record.checkOutTime == null
                    )
                      status = "present";
                    else if (
                      record.checkInTime != null &&
                      record.checkOutTime != null
                    )
                      status = "checked-out";

                    return (
                      <div
                        key={String(record.id)}
                        className="flex flex-wrap items-center gap-2 px-4 py-2.5"
                      >
                        {/* Mini avatar */}
                        <div
                          className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"
                          style={{
                            border: "1px solid oklch(0.76 0.15 85 / 0.2)",
                          }}
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.src = `https://i.pravatar.cc/150?img=${(Number(record.staffId) % 70) + 1}`;
                              }}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: "oklch(0.20 0.012 80)" }}
                            >
                              <UserCircle2 className="w-4 h-4 text-gold opacity-40" />
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <span className="flex-1 min-w-[80px] text-sm text-foreground font-medium truncate">
                          {name}
                        </span>

                        {/* Times */}
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground">In:</span>
                            <span
                              className="font-semibold"
                              style={{ color: "oklch(0.76 0.15 85)" }}
                            >
                              {formatNanoTime(record.checkInTime)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground">Out:</span>
                            <span
                              className="font-semibold"
                              style={{ color: "oklch(0.85 0.01 80)" }}
                            >
                              {formatNanoTime(record.checkOutTime)}
                            </span>
                          </span>
                        </div>

                        {/* Status badge */}
                        <StatusBadge status={status} />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────────────────────────
export default function StaffAttendanceTab() {
  const { actor, isFetching } = useActor();
  const [view, setView] = useState<"daily" | "monthly">("daily");

  const { data: staffList, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["allStaff"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStaff();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const {
    data: todayRecords,
    isLoading: isLoadingToday,
    refetch: refetchToday,
    isError: isTodayError,
  } = useQuery({
    queryKey: ["todayAttendance"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodayAttendance();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const {
    data: allRecords,
    isLoading: isLoadingAll,
    refetch: refetchAll,
    isError: isAllError,
  } = useQuery({
    queryKey: ["allAttendanceRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAttendanceRecords();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const isLoading =
    isLoadingStaff ||
    isFetching ||
    (view === "daily" ? isLoadingToday : isLoadingAll);
  const isError = view === "daily" ? isTodayError : isAllError;

  function handleRetry() {
    if (view === "daily") refetchToday();
    else refetchAll();
  }

  return (
    <div className="space-y-5">
      {/* Daily / Monthly toggle */}
      <div
        data-ocid="staff_attendance.view.toggle"
        className="flex items-center gap-2 p-1 rounded-xl w-fit"
        style={{
          background: "oklch(0.16 0.006 60)",
          border: "1px solid oklch(0.22 0.008 60)",
        }}
      >
        {(["daily", "monthly"] as const).map((v) => (
          <button
            key={v}
            type="button"
            data-ocid={`staff_attendance.${v}.tab`}
            onClick={() => setView(v)}
            className="text-sm font-semibold px-5 py-1.5 rounded-lg transition-all duration-200"
            style={{
              background: view === v ? "oklch(0.76 0.15 85)" : "transparent",
              color:
                view === v ? "oklch(0.10 0.006 60)" : "oklch(0.55 0.01 80)",
              boxShadow:
                view === v ? "0 2px 8px oklch(0.76 0.15 85 / 0.3)" : "none",
            }}
          >
            {v === "daily" ? "Daily" : "Monthly"}
          </button>
        ))}
      </div>

      {/* Refresh info */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRetry}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors"
          data-ocid="staff_attendance.refresh.button"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Auto-refresh every 30s
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          data-ocid="staff_attendance.loading_state"
          className="flex items-center justify-center py-16"
        >
          <div className="gold-spinner" />
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div
          data-ocid="staff_attendance.error_state"
          className="flex flex-col items-center gap-4 py-16 text-center"
        >
          <AlertTriangle
            className="w-10 h-10 opacity-40"
            style={{ color: "oklch(0.65 0.22 22)" }}
          />
          <p className="text-muted-foreground text-sm">
            Backend temporarily unavailable.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="btn-gold px-5 py-2 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && (
        <>
          {view === "daily" && (
            <DailyView
              staffList={staffList ?? []}
              todayRecords={todayRecords ?? []}
            />
          )}
          {view === "monthly" && (
            <MonthlyView
              staffList={staffList ?? []}
              allRecords={allRecords ?? []}
            />
          )}
        </>
      )}
    </div>
  );
}
