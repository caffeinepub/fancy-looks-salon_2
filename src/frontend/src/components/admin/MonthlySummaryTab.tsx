import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  Crown,
  LogOut,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type {
  AttendanceRecord,
  EarningsEntry,
  HalfDayRecord,
  StaffProfile,
} from "../../backend.d";
import { useActor } from "../../hooks/useActor";

/** Convert YYYY-MM-DD → epoch-days string */
function dateToEpochDays(dateStr: string): string {
  return Math.floor(
    new Date(dateStr).getTime() / (24 * 60 * 60 * 1000),
  ).toString();
}

/** Convert epoch-days string to readable "D/M" format */
function epochDaysToDisplay(dateStr: string): string {
  const n = Number(dateStr);
  if (Number.isNaN(n)) return dateStr;
  const d = new Date(n * 24 * 60 * 60 * 1000);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Convert epoch-days string to full DD/MM/YYYY format */
function epochDaysToFullDate(dateStr: string): string {
  const n = Number(dateStr);
  if (Number.isNaN(n)) return dateStr;
  const d = new Date(n * 24 * 60 * 60 * 1000);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Get all calendar days in the given year/month, up to today */
function getDaysInMonth(year: number, month: number): string[] {
  const today = new Date();
  const days: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDay =
    year === today.getFullYear() && month === today.getMonth() + 1
      ? today.getDate()
      : daysInMonth;

  for (let d = 1; d <= endDay; d++) {
    days.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }
  return days;
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

function formatMinutes(mins: number): string {
  if (mins <= 0) return "0 min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Compute how many minutes a staff joined BEFORE their shift start (early join = overtime bonus) */
function computeEarlyJoinMinutes(
  checkInTime: bigint,
  shiftStart: string,
): number {
  const ms = Number(checkInTime / 1_000_000n);
  const d = new Date(ms);
  const checkInMins = d.getHours() * 60 + d.getMinutes();
  const [sh, sm] = shiftStart.split(":").map(Number);
  const shiftStartMins = (sh ?? 0) * 60 + (sm ?? 0);
  const diff = shiftStartMins - checkInMins; // positive if early
  return diff > 5 ? diff : 0;
}

/**
 * Net Overtime = earlyJoinMinutes + checkoutOvertimeMinutes - lateMinutes
 * Minimum 0
 */
function computeNetOvertimeMinutes(
  checkInTime: bigint | null | undefined,
  checkOutTime: bigint | null | undefined,
  shiftStart: string,
  shiftEnd: string,
): number {
  const earlyJoin =
    checkInTime != null ? computeEarlyJoinMinutes(checkInTime, shiftStart) : 0;
  const late =
    checkInTime != null
      ? computeLateInfo(checkInTime, shiftStart).lateMinutes
      : 0;
  const checkoutOT =
    checkOutTime != null
      ? computeOvertimeInfo(checkOutTime, shiftEnd).overtimeMinutes
      : 0;
  return Math.max(0, earlyJoin + checkoutOT - late);
}

function StaffMonthlySummary({
  staff,
  year,
  month,
  halfDayRecords,
  index,
}: {
  staff: StaffProfile;
  year: number;
  month: number;
  halfDayRecords: HalfDayRecord[];
  index: number;
}) {
  const { actor, isFetching } = useActor();
  const { data: earnings, isLoading: isLoadingEarnings } = useQuery<
    EarningsEntry[]
  >({
    queryKey: ["earnings", String(staff.id), year, month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEarningsByStaffAndMonth(
        staff.id,
        BigInt(year),
        BigInt(month),
      );
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  // Batch fetch all days in month for attendance analytics
  const daysInMonth = getDaysInMonth(year, month);
  const { data: monthlyAttendance, isLoading: isLoadingAttendance } = useQuery<
    AttendanceRecord[]
  >({
    queryKey: ["monthlyAttendance", String(staff.id), year, month],
    queryFn: async () => {
      if (!actor) return [];
      const results = await Promise.all(
        daysInMonth.map((day) =>
          actor.getAttendanceByDate(dateToEpochDays(day)),
        ),
      );
      // Flatten and filter by this staff
      return results
        .flat()
        .filter((r) => String(r.staffId) === String(staff.id));
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000, // Cache monthly data for 1 min
  });

  const isLoading = isLoadingEarnings || isLoadingAttendance;

  const totalEarnings = (earnings ?? []).reduce((sum, e) => sum + e.total, 0n);

  // Use attendance records for presence count (not earnings)
  const att = monthlyAttendance ?? [];
  const daysPresent = att.filter((r) => r.checkInTime != null).length;
  const daysAbsent = Math.max(0, daysInMonth.length - daysPresent);

  // Frontend-computed analytics — reliable vs backend flags
  const lateDays = att.filter(
    (r) =>
      r.checkInTime != null &&
      computeLateInfo(r.checkInTime, staff.shiftStart).isLate,
  ).length;
  const overtimeDays = att.filter(
    (r) =>
      computeNetOvertimeMinutes(
        r.checkInTime,
        r.checkOutTime,
        staff.shiftStart,
        staff.shiftEnd,
      ) > 0,
  ).length;
  const totalOvertimeMinutes = att.reduce((sum, r) => {
    return (
      sum +
      computeNetOvertimeMinutes(
        r.checkInTime,
        r.checkOutTime,
        staff.shiftStart,
        staff.shiftEnd,
      )
    );
  }, 0);
  const earlyExitDays = att.filter(
    (r) =>
      r.checkOutTime != null &&
      computeOvertimeInfo(r.checkOutTime, staff.shiftEnd).isEarlyExit,
  ).length;
  const halfDayCount = halfDayRecords.filter(
    (r) => String(r.staffId) === String(staff.id),
  ).length;

  // Detail records for late and overtime
  const lateRecords = att
    .filter(
      (r) =>
        r.checkInTime != null &&
        computeLateInfo(r.checkInTime, staff.shiftStart).isLate,
    )
    .map((r) => ({
      date: epochDaysToFullDate(r.date),
      minutes: computeLateInfo(r.checkInTime!, staff.shiftStart).lateMinutes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const overtimeRecords = att
    .filter(
      (r) =>
        computeNetOvertimeMinutes(
          r.checkInTime,
          r.checkOutTime,
          staff.shiftStart,
          staff.shiftEnd,
        ) > 0,
    )
    .map((r) => {
      const netOT = computeNetOvertimeMinutes(
        r.checkInTime,
        r.checkOutTime,
        staff.shiftStart,
        staff.shiftEnd,
      );
      const earlyJoin =
        r.checkInTime != null
          ? computeEarlyJoinMinutes(r.checkInTime, staff.shiftStart)
          : 0;
      const late =
        r.checkInTime != null
          ? computeLateInfo(r.checkInTime, staff.shiftStart).lateMinutes
          : 0;
      const checkoutOT =
        r.checkOutTime != null
          ? computeOvertimeInfo(r.checkOutTime, staff.shiftEnd).overtimeMinutes
          : 0;
      return {
        date: epochDaysToFullDate(r.date),
        minutes: netOT,
        earlyJoin,
        late,
        checkoutOT,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const hasDetails = lateRecords.length > 0 || overtimeRecords.length > 0;

  return (
    <motion.div
      data-ocid={`monthly_summary.staff_row.${index + 1}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="rounded-xl p-4 luxury-card"
    >
      <div className="flex flex-wrap items-start gap-4">
        {/* Staff info */}
        <div className="flex items-center gap-3 w-44 flex-shrink-0">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full overflow-hidden"
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
            {staff.isPremium && (
              <span
                className="text-[10px]"
                style={{ color: "oklch(0.76 0.15 85 / 0.7)" }}
              >
                Premium
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center py-4">
            <div className="gold-spinner w-5 h-5" />
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            {/* Row 1: Presence + Earnings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatBox
                value={daysPresent}
                label="Days Present"
                color="oklch(0.68 0.18 148)"
                bg="oklch(0.68 0.18 148 / 0.08)"
                border="oklch(0.68 0.18 148 / 0.2)"
              />
              <StatBox
                value={daysAbsent}
                label="Days Absent"
                color="oklch(0.65 0.22 22)"
                bg="oklch(0.60 0.22 22 / 0.08)"
                border="oklch(0.60 0.22 22 / 0.2)"
              />
              <div
                className="text-center p-2 rounded-lg col-span-2"
                style={{
                  background: "oklch(0.76 0.15 85 / 0.08)",
                  border: "1px solid oklch(0.76 0.15 85 / 0.25)",
                }}
              >
                <p className="font-display text-xl font-bold gold-text-gradient">
                  ₹{Number(totalEarnings).toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Total Earnings
                </p>
              </div>
            </div>

            {/* Row 2: Analytics badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <AnalyticStatBox
                icon={<AlertTriangle className="w-3 h-3" />}
                value={lateDays}
                label="Late Days"
                color="oklch(0.65 0.22 22)"
                bg="oklch(0.60 0.22 22 / 0.08)"
                border="oklch(0.60 0.22 22 / 0.2)"
              />
              <AnalyticStatBox
                icon={<TrendingUp className="w-3 h-3" />}
                value={overtimeDays}
                label="Overtime Days"
                color="oklch(0.76 0.15 85)"
                bg="oklch(0.76 0.15 85 / 0.08)"
                border="oklch(0.76 0.15 85 / 0.2)"
                subValue={
                  totalOvertimeMinutes > 0
                    ? `${formatMinutes(totalOvertimeMinutes)} total`
                    : undefined
                }
              />
              <AnalyticStatBox
                icon={<LogOut className="w-3 h-3" />}
                value={earlyExitDays}
                label="Early Exits"
                color="oklch(0.68 0.20 45)"
                bg="oklch(0.65 0.20 45 / 0.08)"
                border="oklch(0.65 0.20 45 / 0.2)"
              />
              <AnalyticStatBox
                icon={<span className="text-[10px]">½</span>}
                value={halfDayCount}
                label="Half Days"
                color="oklch(0.65 0.18 270)"
                bg="oklch(0.60 0.18 270 / 0.08)"
                border="oklch(0.60 0.18 270 / 0.2)"
              />
            </div>
          </div>
        )}
      </div>

      {/* Earnings breakdown */}
      {!isLoading && earnings && earnings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3 h-3 text-gold opacity-60" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Earnings per day
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {earnings.map((e) => (
              <span
                key={String(e.id)}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.76 0.15 85 / 0.08)",
                  color: "oklch(0.76 0.15 85 / 0.8)",
                  border: "1px solid oklch(0.76 0.15 85 / 0.2)",
                }}
              >
                {epochDaysToDisplay(e.date)}: ₹
                {Number(e.total).toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Date-wise Late & Overtime detail - always visible */}
      {!isLoading && hasDetails && (
        <div className="mt-3 pt-3 border-t border-border space-y-4">
          {/* Late days */}
          {lateRecords.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle
                  className="w-3 h-3"
                  style={{ color: "oklch(0.65 0.22 22)" }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "oklch(0.65 0.22 22 / 0.8)" }}
                >
                  দেরিতে আসার দিনগুলি
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lateRecords.map((rec) => (
                  <span
                    key={rec.date}
                    className="text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{
                      background: "oklch(0.60 0.22 22 / 0.10)",
                      border: "1px solid oklch(0.65 0.22 22 / 0.30)",
                      color: "oklch(0.65 0.22 22)",
                    }}
                  >
                    <span>📅</span>
                    <span>{rec.date}</span>
                    <span className="opacity-60">—</span>
                    <span className="font-semibold">
                      Late +{formatMinutes(rec.minutes)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Overtime days */}
          {overtimeRecords.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp
                  className="w-3 h-3"
                  style={{ color: "oklch(0.76 0.15 85)" }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "oklch(0.76 0.15 85 / 0.8)" }}
                >
                  অতিরিক্ত কাজের দিনগুলি
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {overtimeRecords.map((rec) => (
                  <span
                    key={rec.date}
                    className="text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 flex-wrap"
                    style={{
                      background: "oklch(0.76 0.15 85 / 0.08)",
                      border: "1px solid oklch(0.76 0.15 85 / 0.30)",
                      color: "oklch(0.76 0.15 85)",
                    }}
                  >
                    <span>📅</span>
                    <span>{rec.date}</span>
                    <span className="opacity-60">—</span>
                    <span className="font-semibold">
                      OT +{formatMinutes(rec.minutes)}
                    </span>
                    {(rec.earlyJoin > 0 || rec.late > 0) && (
                      <span className="opacity-60 text-[10px]">
                        (
                        {rec.earlyJoin > 0
                          ? `Early +${formatMinutes(rec.earlyJoin)}`
                          : ""}
                        {rec.checkoutOT > 0
                          ? `${rec.earlyJoin > 0 ? " " : ""}+${formatMinutes(rec.checkoutOT)}`
                          : ""}
                        {rec.late > 0
                          ? ` − Late ${formatMinutes(rec.late)}`
                          : ""}
                        )
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function StatBox({
  value,
  label,
  color,
  bg,
  border,
}: {
  value: number;
  label: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      className="text-center p-2 rounded-lg"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <p className="font-display text-lg font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function AnalyticStatBox({
  icon,
  value,
  label,
  color,
  bg,
  border,
  subValue,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  bg: string;
  border: string;
  subValue?: string;
}) {
  return (
    <div
      className="text-center p-2 rounded-lg"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <span style={{ color }}>{icon}</span>
        <p className="font-display text-lg font-bold" style={{ color }}>
          {value}
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {subValue && (
        <p className="text-[10px] text-muted-foreground opacity-70 mt-0.5">
          {subValue}
        </p>
      )}
    </div>
  );
}

export default function MonthlySummaryTab() {
  const { actor, isFetching } = useActor();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

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

  // Fetch all half days for the month (once, shared across all staff rows)
  const { data: halfDayRecords } = useQuery<HalfDayRecord[]>({
    queryKey: ["halfDaysByMonth", year, month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHalfDaysByMonth(BigInt(year), BigInt(month));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const activeStaff = (staffList ?? []).filter((s) => s.isActive);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthInput = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      {/* Month/Year picker */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold" />
          <label
            htmlFor="monthly-month-input"
            className="text-sm text-muted-foreground"
          >
            Select Month:
          </label>
        </div>
        <input
          id="monthly-month-input"
          data-ocid="monthly_summary.month_select"
          type="month"
          value={monthInput}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-");
            setYear(Number(y));
            setMonth(Number(m));
          }}
          className="font-body text-sm px-3 py-1.5 rounded-lg bg-input border border-border text-foreground"
          max={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`}
        />
        <span className="text-sm text-muted-foreground">
          {monthNames[month - 1]} {year}
        </span>
      </div>

      {/* Legend */}
      <div
        className="rounded-lg p-3 text-xs flex flex-wrap gap-x-5 gap-y-1.5"
        style={{
          background: "oklch(0.76 0.15 85 / 0.05)",
          border: "1px solid oklch(0.76 0.15 85 / 0.15)",
        }}
      >
        <span className="text-muted-foreground flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: "oklch(0.68 0.18 148)" }}
          />
          Present = days with check-in recorded
        </span>
        <span className="text-muted-foreground flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: "oklch(0.65 0.22 22)" }}
          />
          Late / Overtime / Early Exit = from timestamps
        </span>
      </div>

      {/* Loading */}
      {isLoadingStaff && (
        <div
          data-ocid="monthly_summary.loading_state"
          className="flex justify-center py-12"
        >
          <div className="gold-spinner" />
        </div>
      )}

      {/* Staff list */}
      {!isLoadingStaff && (
        <div data-ocid="monthly_summary.staff_table">
          {activeStaff.length === 0 ? (
            <div
              data-ocid="monthly_summary.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <p>No active staff found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeStaff.map((staff, i) => (
                <StaffMonthlySummary
                  key={String(staff.id)}
                  staff={staff}
                  year={year}
                  month={month}
                  halfDayRecords={halfDayRecords ?? []}
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
