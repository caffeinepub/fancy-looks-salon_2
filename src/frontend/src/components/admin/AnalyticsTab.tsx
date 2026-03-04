import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Crown,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { AttendanceRecord, StaffProfile } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

function formatNanoTimestamp(ns: bigint | undefined): string {
  if (!ns) return "—";
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTodayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateInputToBackend(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

export default function AnalyticsTab() {
  const { actor, isFetching } = useActor();
  const [selectedDate, setSelectedDate] = useState(getTodayDateInput());

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

  const { data: attendanceList, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["todayAttendance"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodayAttendance();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const isLoading = isLoadingStaff || isLoadingAttendance || isFetching;
  const backendDate = dateInputToBackend(selectedDate);
  const isToday =
    backendDate === new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const activeStaff = (staffList ?? []).filter((s) => s.isActive);

  const getAttendance = (staff: StaffProfile): AttendanceRecord | undefined => {
    if (!isToday) return undefined; // Only today's data available
    return attendanceList?.find((r) => String(r.staffId) === String(staff.id));
  };

  return (
    <div className="space-y-5">
      {/* Date picker */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold" />
          <label
            htmlFor="analytics-date-input"
            className="text-sm text-muted-foreground font-body"
          >
            Select Date:
          </label>
        </div>
        <Input
          id="analytics-date-input"
          data-ocid="analytics.date_select"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-44 font-body bg-input border-border text-foreground text-sm"
          max={getTodayDateInput()}
        />
        {!isToday && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "oklch(0.78 0.16 52 / 0.15)",
              color: "oklch(0.78 0.16 52)",
            }}
          >
            Historical data — only today's attendance is available
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          data-ocid="analytics.loading_state"
          className="flex justify-center py-12"
        >
          <div className="gold-spinner" />
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div data-ocid="analytics.staff_table">
          {activeStaff.length === 0 ? (
            <div
              data-ocid="analytics.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <p>No staff found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeStaff.map((staff, i) => {
                const att = getAttendance(staff);
                return (
                  <motion.div
                    key={String(staff.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className="rounded-xl p-4 luxury-card"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Staff info */}
                      <div className="flex items-center gap-3 min-w-0 w-48">
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-10 h-10 rounded-full overflow-hidden"
                            style={{
                              border: "1.5px solid oklch(0.76 0.15 85 / 0.3)",
                            }}
                          >
                            {staff.photoUrl ? (
                              <img
                                src={staff.photoUrl}
                                alt={staff.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const img =
                                    e.currentTarget as HTMLImageElement;
                                  img.src = `https://i.pravatar.cc/150?img=${(Number(staff.id) % 70) + 1}`;
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
                          {staff.isPremium && (
                            <div
                              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                              style={{ background: "oklch(0.76 0.15 85)" }}
                            >
                              <Crown className="w-2 h-2 text-background" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground font-display truncate">
                            {staff.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {staff.shiftStart}–{staff.shiftEnd}
                          </p>
                        </div>
                      </div>

                      {/* Attendance info */}
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        {staff.isPremium ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full"
                            style={{
                              background: "oklch(0.76 0.15 85 / 0.1)",
                              color: "oklch(0.76 0.15 85)",
                              border: "1px solid oklch(0.76 0.15 85 / 0.3)",
                            }}
                          >
                            <Crown className="w-3 h-3" />
                            Premium — Flexible Schedule
                          </span>
                        ) : (
                          <>
                            {isToday && att ? (
                              <>
                                {/* Check-in time */}
                                {att.checkInTime && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    In: {formatNanoTimestamp(att.checkInTime)}
                                  </div>
                                )}
                                {att.checkOutTime && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    Out: {formatNanoTimestamp(att.checkOutTime)}
                                  </div>
                                )}
                                {att.isLate && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                    style={{
                                      background: "oklch(0.60 0.22 22 / 0.15)",
                                      color: "oklch(0.65 0.22 22)",
                                      border:
                                        "1px solid oklch(0.60 0.22 22 / 0.3)",
                                    }}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    Late Joining
                                  </span>
                                )}
                                {att.isEarlyExit && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                    style={{
                                      background: "oklch(0.78 0.16 52 / 0.15)",
                                      color: "oklch(0.78 0.16 52)",
                                      border:
                                        "1px solid oklch(0.78 0.16 52 / 0.3)",
                                    }}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    Early Exit
                                  </span>
                                )}
                                {att.overtimeMinutes > 0n && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                    style={{
                                      background: "oklch(0.76 0.15 85 / 0.12)",
                                      color: "oklch(0.76 0.15 85)",
                                      border:
                                        "1px solid oklch(0.76 0.15 85 / 0.25)",
                                    }}
                                  >
                                    <TrendingUp className="w-3 h-3" />
                                    {String(att.overtimeMinutes)} min Overtime
                                  </span>
                                )}
                                {!att.isLate &&
                                  !att.isEarlyExit &&
                                  att.overtimeMinutes === 0n &&
                                  att.checkInTime && (
                                    <span
                                      className="text-xs text-muted-foreground"
                                      style={{ color: "oklch(0.68 0.18 148)" }}
                                    >
                                      ✓ On Time
                                    </span>
                                  )}
                                {!att.checkInTime && (
                                  <span className="text-xs text-muted-foreground">
                                    Absent / Not Yet In
                                  </span>
                                )}
                              </>
                            ) : isToday && !att ? (
                              <span className="text-xs text-muted-foreground">
                                Not checked in today
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Historical data unavailable — only today's
                                analytics are supported
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
