import { useQuery } from "@tanstack/react-query";
import { Clock, Crown, RefreshCw, UserCircle2 } from "lucide-react";
import { motion } from "motion/react";
import type {
  AttendanceRecord,
  EarningsEntry,
  StaffProfile,
} from "../../backend.d";
import { useActor } from "../../hooks/useActor";

function formatNanoTimestamp(ns: bigint | undefined): string {
  if (!ns) return "—";
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
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
  const isCheckedIn =
    attendance?.checkInTime !== undefined &&
    attendance?.checkOutTime === undefined;
  const isCheckedOut =
    attendance?.checkInTime !== undefined &&
    attendance?.checkOutTime !== undefined;
  const notIn = !attendance?.checkInTime;

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
      <div>
        {isCheckedIn && (
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
            <p className="text-xs text-muted-foreground pl-1">
              In: {formatNanoTimestamp(attendance?.checkInTime)}
            </p>
          </div>
        )}
        {notIn && (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              background: "oklch(0.18 0.006 60)",
              color: "oklch(0.50 0.006 60)",
              border: "1px solid oklch(0.28 0.006 60)",
            }}
          >
            Not Yet In
          </span>
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

      {/* Flags */}
      {!staff.isPremium && attendance && (
        <div className="flex flex-wrap gap-1">
          {attendance.isLate && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "oklch(0.60 0.22 22 / 0.15)",
                color: "oklch(0.65 0.22 22)",
              }}
            >
              Late
            </span>
          )}
          {attendance.isEarlyExit && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "oklch(0.78 0.16 52 / 0.15)",
                color: "oklch(0.78 0.16 52)",
              }}
            >
              Early Exit
            </span>
          )}
          {attendance.overtimeMinutes > 0n && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "oklch(0.76 0.15 85 / 0.12)",
                color: "oklch(0.76 0.15 85)",
              }}
            >
              +{String(attendance.overtimeMinutes)}min OT
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function LiveStatusTab() {
  const { actor, isFetching } = useActor();
  const todayDate = getTodayDate();

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
              .then((entries) => entries.filter((e) => e.date === todayDate)),
          ),
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && !!staffList && staffList.length > 0,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const isLoading = isLoadingStaff || isLoadingAttendance || isFetching;
  // earningsList is used via getEarnings()
  const activeStaff = (staffList ?? []).filter((s) => s.isActive);

  const getAttendance = (staff: StaffProfile): AttendanceRecord | undefined =>
    attendanceList?.find((r) => String(r.staffId) === String(staff.id));

  const getEarnings = (staff: StaffProfile): EarningsEntry | undefined =>
    earningsList?.find((e) => String(e.staffId) === String(staff.id));

  const checkedInCount = activeStaff.filter((s) => {
    const a = getAttendance(s);
    return a?.checkInTime !== undefined && a?.checkOutTime === undefined;
  }).length;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Active Staff", value: activeStaff.length },
          { label: "Currently In", value: checkedInCount, gold: true },
          {
            label: "Not Yet In",
            value: activeStaff.filter((s) => !getAttendance(s)?.checkInTime)
              .length,
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
