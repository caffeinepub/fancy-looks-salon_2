import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Crown,
  LogOut,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  AttendanceRecord,
  HalfDayRecord,
  StaffProfile,
} from "../../backend.d";
import { useActor } from "../../hooks/useActor";

const ADMIN_PASSWORD = "Fancy0308";

function formatNanoTimestamp(ns: bigint | undefined | null): string {
  if (ns == null) return "—";
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTodayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convert YYYY-MM-DD → epoch-days string (backend format) */
function dateToEpochDays(dateStr: string): string {
  return Math.floor(
    new Date(dateStr).getTime() / (24 * 60 * 60 * 1000),
  ).toString();
}

/** Format minutes as "Xh Ym" */
function formatMinutes(mins: number): string {
  if (mins <= 0) return "0 min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Compute late info from raw check-in timestamp vs shift start */
function computeLateInfo(
  checkInTime: bigint,
  shiftStart: string,
): { isLate: boolean; lateMinutes: number } {
  const ms = Number(checkInTime / 1_000_000n);
  const d = new Date(ms);
  const checkInMins = d.getHours() * 60 + d.getMinutes();
  const [sh, sm] = shiftStart.split(":").map(Number);
  const shiftStartMins = (sh ?? 0) * 60 + (sm ?? 0);
  const diff = checkInMins - shiftStartMins;
  return { isLate: diff > 5, lateMinutes: diff > 5 ? diff : 0 };
}

/** Compute overtime / early-exit info from raw check-out timestamp vs shift end */
function computeOvertimeInfo(
  checkOutTime: bigint,
  shiftEnd: string,
): { isEarlyExit: boolean; overtimeMinutes: number } {
  const ms = Number(checkOutTime / 1_000_000n);
  const d = new Date(ms);
  const checkOutMins = d.getHours() * 60 + d.getMinutes();
  const [eh, em] = shiftEnd.split(":").map(Number);
  const shiftEndMins = (eh ?? 0) * 60 + (em ?? 0);
  const diff = checkOutMins - shiftEndMins;
  return { isEarlyExit: diff < -5, overtimeMinutes: diff > 5 ? diff : 0 };
}

export default function AnalyticsTab() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(getTodayDateInput());

  const epochDays = dateToEpochDays(selectedDate);

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

  const { data: attendanceList, isLoading: isLoadingAttendance } = useQuery<
    AttendanceRecord[]
  >({
    queryKey: ["attendanceByDate", selectedDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendanceByDate(epochDays);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const { data: halfDayList, isLoading: isLoadingHalfDays } = useQuery<
    HalfDayRecord[]
  >({
    queryKey: ["halfDaysByDate", selectedDate],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHalfDaysByDate(epochDays);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const markHalfDayMutation = useMutation({
    mutationFn: async ({ staffId }: { staffId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.markHalfDay(ADMIN_PASSWORD, staffId, epochDays);
    },
    onSuccess: () => {
      toast.success("Half day marked");
      queryClient.invalidateQueries({
        queryKey: ["halfDaysByDate", selectedDate],
      });
    },
    onError: () => {
      toast.error("Failed to mark half day");
    },
  });

  const removeHalfDayMutation = useMutation({
    mutationFn: async ({ staffId }: { staffId: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeHalfDay(ADMIN_PASSWORD, staffId, epochDays);
    },
    onSuccess: () => {
      toast.success("Half day unmarked");
      queryClient.invalidateQueries({
        queryKey: ["halfDaysByDate", selectedDate],
      });
    },
    onError: () => {
      toast.error("Failed to unmark half day");
    },
  });

  const isLoading =
    isLoadingStaff || isLoadingAttendance || isLoadingHalfDays || isFetching;

  const activeStaff = (staffList ?? []).filter((s) => s.isActive);

  const getAttendance = (staff: StaffProfile): AttendanceRecord | undefined =>
    attendanceList?.find((r) => String(r.staffId) === String(staff.id));

  const isHalfDay = (staff: StaffProfile): boolean =>
    !!halfDayList?.find((r) => String(r.staffId) === String(staff.id));

  return (
    <div className="space-y-5">
      {/* Date picker */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold" />
          <label
            htmlFor="analytics-date-input"
            className="text-sm text-muted-foreground font-body"
          >
            Select Date:
          </label>
        </div>
        <input
          id="analytics-date-input"
          data-ocid="analytics.date_select"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-44 font-body text-sm px-3 py-1.5 rounded-lg bg-input border border-border text-foreground"
          max={getTodayDateInput()}
        />
        {selectedDate !== getTodayDateInput() && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "oklch(0.78 0.16 52 / 0.15)",
              color: "oklch(0.78 0.16 52)",
            }}
          >
            Historical View
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
                const halfDay = isHalfDay(staff);
                const isMarkingHalfDay =
                  markHalfDayMutation.isPending &&
                  String(markHalfDayMutation.variables?.staffId) ===
                    String(staff.id);
                const isRemovingHalfDay =
                  removeHalfDayMutation.isPending &&
                  String(removeHalfDayMutation.variables?.staffId) ===
                    String(staff.id);

                // Frontend-computed analytics (reliable vs backend flags)
                const lateInfo =
                  att?.checkInTime != null
                    ? computeLateInfo(att.checkInTime, staff.shiftStart)
                    : null;
                const overtimeInfo =
                  att?.checkOutTime != null
                    ? computeOvertimeInfo(att.checkOutTime, staff.shiftEnd)
                    : null;

                const hasCheckedIn = att?.checkInTime != null;
                const isOnTime = hasCheckedIn && !lateInfo?.isLate;

                return (
                  <motion.div
                    key={String(staff.id)}
                    data-ocid={`analytics.staff_row.${i + 1}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className="rounded-xl p-4 luxury-card"
                  >
                    <div className="flex flex-wrap items-start gap-4">
                      {/* Staff info */}
                      <div className="flex items-center gap-3 min-w-0 w-44 flex-shrink-0">
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

                      {/* Attendance badges */}
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
                            {att ? (
                              <>
                                {/* Check-in/out times */}
                                {att.checkInTime != null && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    In: {formatNanoTimestamp(att.checkInTime)}
                                  </div>
                                )}
                                {att.checkOutTime != null && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    Out: {formatNanoTimestamp(att.checkOutTime)}
                                  </div>
                                )}

                                {/* Late Joining — frontend computed */}
                                {lateInfo?.isLate && (
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
                                    Late +{formatMinutes(lateInfo.lateMinutes)}
                                  </span>
                                )}

                                {/* Early Exit — frontend computed, separate section */}
                                {overtimeInfo?.isEarlyExit && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                    style={{
                                      background: "oklch(0.65 0.20 45 / 0.15)",
                                      color: "oklch(0.68 0.20 45)",
                                      border:
                                        "1px solid oklch(0.65 0.20 45 / 0.3)",
                                    }}
                                  >
                                    <LogOut className="w-3 h-3" />
                                    Early Exit
                                  </span>
                                )}

                                {/* Overtime — frontend computed */}
                                {overtimeInfo != null &&
                                  overtimeInfo.overtimeMinutes > 0 && (
                                    <span
                                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                      style={{
                                        background:
                                          "oklch(0.76 0.15 85 / 0.12)",
                                        color: "oklch(0.76 0.15 85)",
                                        border:
                                          "1px solid oklch(0.76 0.15 85 / 0.25)",
                                      }}
                                    >
                                      <TrendingUp className="w-3 h-3" />
                                      Extra +
                                      {formatMinutes(
                                        overtimeInfo.overtimeMinutes,
                                      )}
                                    </span>
                                  )}

                                {/* On time */}
                                {isOnTime &&
                                  !overtimeInfo?.isEarlyExit &&
                                  !(
                                    overtimeInfo != null &&
                                    overtimeInfo.overtimeMinutes > 0
                                  ) && (
                                    <span
                                      className="text-xs font-medium"
                                      style={{ color: "oklch(0.68 0.18 148)" }}
                                    >
                                      ✓ On Time
                                    </span>
                                  )}

                                {/* Not checked in → Absent */}
                                {att.checkInTime == null && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                    style={{
                                      background: "oklch(0.60 0.22 22 / 0.15)",
                                      color: "oklch(0.65 0.22 22)",
                                      border:
                                        "1px solid oklch(0.60 0.22 22 / 0.3)",
                                    }}
                                  >
                                    Absent
                                  </span>
                                )}
                              </>
                            ) : (
                              /* No attendance record at all → Absent */
                              <span
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                                style={{
                                  background: "oklch(0.60 0.22 22 / 0.15)",
                                  color: "oklch(0.65 0.22 22)",
                                  border: "1px solid oklch(0.60 0.22 22 / 0.3)",
                                }}
                              >
                                Absent
                              </span>
                            )}
                          </>
                        )}

                        {/* Half Day badge */}
                        {halfDay && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                            style={{
                              background: "oklch(0.60 0.18 270 / 0.15)",
                              color: "oklch(0.65 0.18 270)",
                              border: "1px solid oklch(0.60 0.18 270 / 0.3)",
                            }}
                          >
                            ½ Half Day
                          </span>
                        )}
                      </div>

                      {/* Half Day action */}
                      <div className="flex-shrink-0 flex items-center">
                        {halfDay ? (
                          <Button
                            data-ocid={`analytics.half_day_unmark.${i + 1}`}
                            size="sm"
                            variant="outline"
                            disabled={isRemovingHalfDay}
                            onClick={() =>
                              removeHalfDayMutation.mutate({
                                staffId: staff.id,
                              })
                            }
                            className="h-7 text-xs font-body gap-1"
                            style={{
                              borderColor: "oklch(0.60 0.18 270 / 0.5)",
                              color: "oklch(0.65 0.18 270)",
                              background: "oklch(0.60 0.18 270 / 0.08)",
                            }}
                          >
                            {isRemovingHalfDay ? (
                              <div className="gold-spinner w-3 h-3" />
                            ) : null}
                            Unmark Half Day
                          </Button>
                        ) : (
                          <Button
                            data-ocid={`analytics.half_day_mark.${i + 1}`}
                            size="sm"
                            variant="outline"
                            disabled={isMarkingHalfDay}
                            onClick={() =>
                              markHalfDayMutation.mutate({ staffId: staff.id })
                            }
                            className="h-7 text-xs font-body gap-1"
                            style={{
                              borderColor: "oklch(0.76 0.15 85 / 0.3)",
                              color: "oklch(0.78 0.12 85 / 0.7)",
                              background: "transparent",
                            }}
                          >
                            {isMarkingHalfDay ? (
                              <div className="gold-spinner w-3 h-3" />
                            ) : null}
                            Mark Half Day
                          </Button>
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
