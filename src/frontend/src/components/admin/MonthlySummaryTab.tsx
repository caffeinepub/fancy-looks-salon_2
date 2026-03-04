import { useQuery } from "@tanstack/react-query";
import { Calendar, Crown, TrendingUp, UserCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { EarningsEntry, StaffProfile } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

const WORKING_DAYS_PER_MONTH = 26;

function StaffMonthlySummary({
  staff,
  year,
  month,
  index,
}: {
  staff: StaffProfile;
  year: number;
  month: number;
  index: number;
}) {
  const { actor, isFetching } = useActor();

  const { data: earnings, isLoading } = useQuery<EarningsEntry[]>({
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

  const totalEarnings = (earnings ?? []).reduce((sum, e) => sum + e.total, 0n);
  const daysPresent = (earnings ?? []).length; // Each earnings entry = 1 day present (proxy)
  const daysAbsent = Math.max(0, WORKING_DAYS_PER_MONTH - daysPresent);

  return (
    <motion.div
      data-ocid={`monthly_summary.staff_row.${index + 1}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="rounded-xl p-4 luxury-card"
    >
      <div className="flex flex-wrap items-center gap-4">
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
          <div className="flex-1 flex justify-center">
            <div className="gold-spinner w-5 h-5" />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              className="text-center p-2 rounded-lg"
              style={{
                background: "oklch(0.68 0.18 148 / 0.08)",
                border: "1px solid oklch(0.68 0.18 148 / 0.2)",
              }}
            >
              <p
                className="font-display text-lg font-bold"
                style={{ color: "oklch(0.68 0.18 148)" }}
              >
                {daysPresent}
              </p>
              <p className="text-[11px] text-muted-foreground">Days Present</p>
            </div>
            <div
              className="text-center p-2 rounded-lg"
              style={{
                background: "oklch(0.60 0.22 22 / 0.08)",
                border: "1px solid oklch(0.60 0.22 22 / 0.2)",
              }}
            >
              <p
                className="font-display text-lg font-bold"
                style={{ color: "oklch(0.65 0.22 22)" }}
              >
                {daysAbsent}
              </p>
              <p className="text-[11px] text-muted-foreground">Days Absent</p>
            </div>
            <div
              className="text-center p-2 rounded-lg col-span-2 md:col-span-2"
              style={{
                background: "oklch(0.76 0.15 85 / 0.08)",
                border: "1px solid oklch(0.76 0.15 85 / 0.25)",
              }}
            >
              <p className="font-display text-xl font-bold gold-text-gradient">
                ₹{Number(totalEarnings).toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Total Monthly Earnings
              </p>
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
                {e.date.slice(6, 8)}/{e.date.slice(4, 6)}: ₹
                {Number(e.total).toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
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

      {/* Totals hint */}
      <div
        className="rounded-lg p-3 text-sm"
        style={{
          background: "oklch(0.76 0.15 85 / 0.05)",
          border: "1px solid oklch(0.76 0.15 85 / 0.15)",
        }}
      >
        <p className="text-muted-foreground text-xs">
          <span className="text-gold">Note:</span> Days Present is calculated
          from earnings entries (days with recorded earnings). Days Absent ={" "}
          {WORKING_DAYS_PER_MONTH} working days − Days Present. For full
          attendance analytics, check the Analytics tab.
        </p>
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
