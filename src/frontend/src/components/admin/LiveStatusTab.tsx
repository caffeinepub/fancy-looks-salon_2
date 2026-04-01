import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Clock,
  Crown,
  LogOut,
  Pencil,
  RefreshCw,
  TrendingUp,
  UserCircle2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  AttendanceRecord,
  EarningsEntry,
  StaffProfile,
} from "../../backend.d";
import { useActor } from "../../hooks/useActor";

function formatNanoTimestamp(ns: bigint | undefined | null): string {
  if (ns == null) return "—";
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Returns epoch-days string (matches backend date storage format) */
function getTodayEpochDays(): string {
  return Math.floor(Date.now() / (24 * 60 * 60 * 1000)).toString();
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

function StaffStatusCard({
  staff,
  attendance,
  earnings,
  index,
}: {
  staff: StaffProfile;
  attendance: AttendanceRecord | undefined;
  earnings: EarningsEntry | undefined;
  index: number;
}) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editTime, setEditTime] = useState("");

  // Robust null-safe state checks
  const isCheckedIn =
    !!attendance &&
    attendance.checkInTime != null &&
    attendance.checkOutTime == null;
  const isCheckedOut =
    !!attendance &&
    attendance.checkInTime != null &&
    attendance.checkOutTime != null;
  const notIn = !attendance || attendance.checkInTime == null;
  const hasCheckIn = isCheckedIn || isCheckedOut;

  // Frontend-computed flags (reliable)
  const lateInfo =
    attendance?.checkInTime != null
      ? computeLateInfo(attendance.checkInTime, staff.shiftStart)
      : null;
  const overtimeInfo =
    attendance?.checkOutTime != null
      ? computeOvertimeInfo(attendance.checkOutTime, staff.shiftEnd)
      : null;

  const editMutation = useMutation({
    mutationFn: async (timeStr: string) => {
      if (!actor || !attendance) throw new Error("Not ready");
      const [hStr, mStr] = timeStr.split(":");
      const h = Number.parseInt(hStr ?? "0", 10);
      const m = Number.parseInt(mStr ?? "0", 10);
      await (actor as any).updateCheckInTime(
        "Fancy0308",
        staff.id,
        attendance.date,
        BigInt(h),
        BigInt(m),
      );
    },
    onSuccess: () => {
      toast.success("Check-in time updated!");
      queryClient.invalidateQueries({ queryKey: ["todayAttendance"] });
      setEditMode(false);
      setEditTime("");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    },
  });

  function handleEditOpen() {
    // Pre-fill with current check-in time
    if (attendance?.checkInTime != null) {
      const ms = Number(attendance.checkInTime / 1_000_000n);
      const d = new Date(ms);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setEditTime(`${hh}:${mm}`);
    }
    setEditMode(true);
  }

  function handleEditCancel() {
    setEditMode(false);
    setEditTime("");
  }

  function handleEditConfirm() {
    if (!editTime) return;
    editMutation.mutate(editTime);
  }

  return (
    <motion.div
      data-ocid={`live_status.staff_card.${index + 1}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="rounded-xl p-4 luxury-card space-y-3"
    >
      {/* Top: photo + name */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full overflow-hidden"
            style={{ border: "1.5px solid oklch(0.76 0.15 85 / 0.3)" }}
          >
            {staff.photoUrl ? (
              <img
                src={staff.photoUrl}
                alt={staff.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.src = `https://i.pravatar.cc/150?img=${(Number(staff.id) % 70) + 1}`;
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "oklch(0.20 0.012 80)" }}
              >
                <UserCircle2 className="w-7 h-7 text-gold opacity-50" />
              </div>
            )}
          </div>
          {staff.isPremium && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.76 0.15 85)" }}
            >
              <Crown className="w-2 h-2 text-background" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm text-foreground truncate">
            {staff.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {staff.shiftStart} – {staff.shiftEnd}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        {isCheckedIn && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: "oklch(0.68 0.18 148 / 0.15)",
                color: "oklch(0.68 0.18 148)",
                border: "1px solid oklch(0.68 0.18 148 / 0.3)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.68_0.18_148)] animate-pulse" />
              Checked In · {formatNanoTimestamp(attendance?.checkInTime)}
            </span>
            {hasCheckIn && (
              <button
                type="button"
                data-ocid={`live_status.edit_checkin_button.${index + 1}`}
                onClick={handleEditOpen}
                className="p-1 rounded-md transition-colors hover:bg-[oklch(0.76_0.15_85_/_0.15)] text-muted-foreground hover:text-gold"
                title="Edit check-in time"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
        {isCheckedOut && (
          <div className="space-y-0.5">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: "oklch(0.50 0.006 60 / 0.3)",
                color: "oklch(0.65 0.006 60)",
                border: "1px solid oklch(0.40 0.006 60)",
              }}
            >
              Checked Out · {formatNanoTimestamp(attendance?.checkOutTime)}
            </span>
            <div className="flex items-center gap-1.5 pl-1">
              <p className="text-xs text-muted-foreground">
                In: {formatNanoTimestamp(attendance?.checkInTime)}
              </p>
              {hasCheckIn && (
                <button
                  type="button"
                  data-ocid={`live_status.edit_checkin_button.${index + 1}`}
                  onClick={handleEditOpen}
                  className="p-0.5 rounded transition-colors hover:bg-[oklch(0.76_0.15_85_/_0.15)] text-muted-foreground hover:text-gold"
                  title="Edit check-in time"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
        {notIn && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              background: "oklch(0.60 0.22 22 / 0.15)",
              color: "oklch(0.65 0.22 22)",
              border: "1px solid oklch(0.60 0.22 22 / 0.3)",
            }}
          >
            Absent
          </span>
        )}

        {/* Inline edit form */}
        {editMode && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg p-2.5 space-y-2"
            style={{
              background: "oklch(0.14 0.008 60)",
              border: "1px solid oklch(0.76 0.15 85 / 0.3)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gold flex-shrink-0" />
              <span className="text-[10px] font-medium text-gold uppercase tracking-wide">
                Edit Check-in Time
              </span>
            </div>
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              data-ocid={`live_status.checkin_time_input.${index + 1}`}
              className="w-full rounded-md px-2.5 py-1.5 text-sm text-foreground bg-transparent outline-none"
              style={{
                background: "oklch(0.10 0.006 60)",
                border: "1px solid oklch(0.76 0.15 85 / 0.35)",
                colorScheme: "dark",
              }}
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                data-ocid={`live_status.checkin_confirm_button.${index + 1}`}
                onClick={handleEditConfirm}
                disabled={!editTime || editMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors disabled:opacity-50"
                style={{
                  background: "oklch(0.76 0.15 85)",
                  color: "oklch(0.08 0.006 60)",
                }}
              >
                <Check className="w-3 h-3" />
                {editMutation.isPending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                data-ocid={`live_status.checkin_cancel_button.${index + 1}`}
                onClick={handleEditCancel}
                disabled={editMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground"
                style={{
                  background: "oklch(0.18 0.008 60)",
                  border: "1px solid oklch(0.28 0.008 60)",
                }}
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Earnings */}
      {earnings && (
        <div
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            background: "oklch(0.76 0.15 85 / 0.07)",
            border: "1px solid oklch(0.76 0.15 85 / 0.18)",
          }}
        >
          <span className="text-muted-foreground text-xs">
            Today's earnings:{" "}
          </span>
          <span className="text-gold font-semibold">
            ₹{Number(earnings.total).toLocaleString()}
          </span>
        </div>
      )}

      {/* Flags — frontend-computed */}
      {!staff.isPremium && attendance && attendance.checkInTime != null && (
        <div className="flex flex-wrap gap-1">
          {lateInfo?.isLate && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: "oklch(0.60 0.22 22 / 0.15)",
                color: "oklch(0.65 0.22 22)",
              }}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              Late +{formatMinutes(lateInfo.lateMinutes)}
            </span>
          )}
          {overtimeInfo?.isEarlyExit && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: "oklch(0.78 0.16 52 / 0.15)",
                color: "oklch(0.78 0.16 52)",
              }}
            >
              <LogOut className="w-2.5 h-2.5" />
              Early Exit
            </span>
          )}
          {overtimeInfo != null && overtimeInfo.overtimeMinutes > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: "oklch(0.76 0.15 85 / 0.12)",
                color: "oklch(0.76 0.15 85)",
              }}
            >
              <TrendingUp className="w-2.5 h-2.5" />
              Extra +{formatMinutes(overtimeInfo.overtimeMinutes)}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function LiveStatusTab() {
  const { actor, isFetching } = useActor();
  const todayEpochDays = getTodayEpochDays();

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
    data: attendanceList,
    isLoading: isLoadingAttendance,
    refetch,
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

  const { data: earningsList } = useQuery({
    queryKey: ["todayEarnings"],
    queryFn: async () => {
      if (!actor || !staffList || staffList.length === 0) return [];
      const year = BigInt(new Date().getFullYear());
      const month = BigInt(new Date().getMonth() + 1);
      const results = await Promise.all(
        staffList
          .filter((s) => s.isActive)
          .map((s) =>
            actor
              .getEarningsByStaffAndMonth(s.id, year, month)
              .then((entries) =>
                entries.filter((e) => e.date === todayEpochDays),
              ),
          ),
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && !!staffList && staffList.length > 0,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const isLoading = isLoadingStaff || isLoadingAttendance || isFetching;
  const activeStaff = (staffList ?? []).filter((s) => s.isActive);

  const getAttendance = (staff: StaffProfile): AttendanceRecord | undefined =>
    attendanceList?.find((r) => String(r.staffId) === String(staff.id));

  const getEarnings = (staff: StaffProfile): EarningsEntry | undefined =>
    earningsList?.find((e) => String(e.staffId) === String(staff.id));

  const checkedInCount = activeStaff.filter((s) => {
    const a = getAttendance(s);
    return !!a && a.checkInTime != null && a.checkOutTime == null;
  }).length;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Active Staff", value: activeStaff.length },
          { label: "Currently In", value: checkedInCount, gold: true },
          {
            label: "Absent / Not In",
            value: activeStaff.filter((s) => {
              const a = getAttendance(s);
              return !a || a.checkInTime == null;
            }).length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-center"
            style={{
              background: "oklch(0.13 0.006 60)",
              border: stat.gold
                ? "1px solid oklch(0.76 0.15 85 / 0.3)"
                : "1px solid oklch(0.22 0.008 60)",
            }}
          >
            <p
              className="font-display text-2xl font-bold"
              style={{ color: stat.gold ? "oklch(0.76 0.15 85)" : undefined }}
            >
              {isLoading ? "—" : stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Auto-refresh every 30s
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          data-ocid="live_status.loading_state"
          className="flex items-center justify-center py-12"
        >
          <div className="gold-spinner" />
        </div>
      )}

      {/* Staff grid */}
      {!isLoading && activeStaff.length === 0 && (
        <div
          data-ocid="live_status.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          <UserCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No active staff found.</p>
        </div>
      )}
      {!isLoading && activeStaff.length > 0 && (
        <motion.div
          data-ocid="live_status.staff_list"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {activeStaff.map((staff, i) => (
            <StaffStatusCard
              key={String(staff.id)}
              staff={staff}
              attendance={getAttendance(staff)}
              earnings={getEarnings(staff)}
              index={i}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
