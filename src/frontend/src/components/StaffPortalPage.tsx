import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Clock,
  Crown,
  LogIn,
  LogOut,
  Save,
  Scissors,
  UserCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  AttendanceRecord,
  EarningsEntry,
  StaffProfile,
} from "../backend.d";
import { useActor } from "../hooks/useActor";

interface StaffPortalPageProps {
  staff: StaffProfile;
  onBack: () => void;
}

function formatNanoTimestamp(ns: bigint | undefined | null): string {
  if (ns == null) return "—";
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Returns epoch-days string (same format as backend stores) */
function getTodayEpochDays(): string {
  return Math.floor(Date.now() / (24 * 60 * 60 * 1000)).toString();
}

function parseEarningsParts(input: string): bigint[] {
  if (!input.trim()) return [];
  return input
    .split(/[+,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !Number.isNaN(Number(s)))
    .map((s) => BigInt(Math.round(Number(s))));
}

function sumParts(parts: bigint[]): bigint {
  return parts.reduce((a, b) => a + b, 0n);
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

export default function StaffPortalPage({
  staff,
  onBack,
}: StaffPortalPageProps) {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  const todayDate = getTodayEpochDays();

  const [earningsInput, setEarningsInput] = useState<string | null>(null);

  // Fetch today's attendance
  const {
    data: attendanceList,
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance,
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

  // Fetch today's earnings
  const { data: earningsList, isLoading: isLoadingEarnings } = useQuery({
    queryKey: [
      "earnings",
      String(staff.id),
      new Date().getFullYear(),
      new Date().getMonth() + 1,
    ],
    queryFn: async () => {
      const year = BigInt(new Date().getFullYear());
      const month = BigInt(new Date().getMonth() + 1);
      if (!actor) return [];
      return actor.getEarningsByStaffAndMonth(staff.id, year, month);
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });

  // Find today's attendance record for this staff member
  const todayAttendance: AttendanceRecord | undefined = attendanceList?.find(
    (r) => r.staffId === staff.id || String(r.staffId) === String(staff.id),
  );

  // Find today's earnings — compare using epoch-days format (matches backend)
  const todayEarnings: EarningsEntry | undefined = earningsList?.find(
    (e) => e.date === todayDate,
  );

  // Derive the displayed earnings input: use user's typed value if set, else fall back to saved
  const displayedEarningsInput =
    earningsInput !== null
      ? earningsInput
      : todayEarnings
        ? todayEarnings.parts.map(String).join("+")
        : "";

  // Robust check-in/out state using null-safe comparisons
  const isCheckedIn =
    !!todayAttendance &&
    todayAttendance.checkInTime != null &&
    todayAttendance.checkOutTime == null;
  const isCheckedOut =
    !!todayAttendance &&
    todayAttendance.checkInTime != null &&
    todayAttendance.checkOutTime != null;

  // Frontend-computed late/overtime info (more reliable than backend flags)
  const lateInfo =
    todayAttendance?.checkInTime != null
      ? computeLateInfo(todayAttendance.checkInTime, staff.shiftStart)
      : null;
  const overtimeInfo =
    todayAttendance?.checkOutTime != null
      ? computeOvertimeInfo(todayAttendance.checkOutTime, staff.shiftEnd)
      : null;

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.checkIn(staff.id);
    },
    onSuccess: () => {
      toast.success(`${staff.name} checked in successfully!`);
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ["todayAttendance"] });
    },
    onError: () => {
      toast.error("Check-in failed. Please try again.");
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.checkOut(staff.id);
    },
    onSuccess: () => {
      toast.success(`${staff.name} checked out successfully!`);
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ["todayAttendance"] });
    },
    onError: (err) => {
      const msg =
        err instanceof Error
          ? err.message.toLowerCase()
          : String(err).toLowerCase();
      if (
        msg.includes("no previous") ||
        msg.includes("not found") ||
        msg.includes("no attendance")
      ) {
        toast.error("আজকের check-in রেকর্ড পাওয়া যায়নি। প্রথমে check-in করুন।", {
          duration: 5000,
        });
      } else {
        toast.error("Check-out failed. Please try again.");
      }
    },
  });

  // Save earnings mutation
  const saveEarningsMutation = useMutation({
    mutationFn: async () => {
      const parts = parseEarningsParts(displayedEarningsInput);
      if (parts.length === 0) throw new Error("No valid amounts entered");
      if (!actor) throw new Error("Not connected");
      return actor.addOrUpdateEarningsEntry(
        "Fancy0308",
        staff.id,
        todayDate,
        parts,
      );
    },
    onSuccess: () => {
      toast.success("Earnings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["earnings"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to save earnings.",
      );
    },
  });

  const parsedParts = parseEarningsParts(displayedEarningsInput);
  const computedTotal = sumParts(parsedParts);
  const isLoading = isLoadingAttendance || isFetching || isLoadingEarnings;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, oklch(0.76 0.15 85 / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border px-6 py-4 flex items-center gap-4">
        <motion.button
          data-ocid="staff_portal.back_button"
          onClick={onBack}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-gold" />
          <span className="font-display text-gold text-sm font-semibold tracking-wide">
            Fancy Looks Salon
          </span>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-6 luxury-card"
        >
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-full overflow-hidden"
                style={{
                  border: "2px solid oklch(0.76 0.15 85 / 0.5)",
                  boxShadow: "0 0 20px oklch(0.76 0.15 85 / 0.2)",
                }}
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
                    <UserCircle2 className="w-10 h-10 text-gold opacity-60" />
                  </div>
                )}
              </div>
              {staff.isPremium && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "oklch(0.76 0.15 85)",
                    boxShadow: "0 0 8px oklch(0.76 0.15 85 / 0.6)",
                  }}
                >
                  <Crown className="w-3 h-3 text-background" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {staff.name}
                </h1>
                {staff.isPremium && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(0.76 0.15 85 / 0.15)",
                      color: "oklch(0.76 0.15 85)",
                      border: "1px solid oklch(0.76 0.15 85 / 0.3)",
                    }}
                  >
                    <Crown className="w-2.5 h-2.5" />
                    Premium
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Shift: {staff.shiftStart} – {staff.shiftEnd}
                </span>
              </div>
              {staff.isPremium && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "oklch(0.76 0.15 85 / 0.7)" }}
                >
                  Flexible schedule — no timing restrictions
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-ocid="staff_portal.loading_state"
              className="flex items-center justify-center py-8"
            >
              <div className="gold-spinner" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attendance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-6 luxury-card space-y-5"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Today's Attendance
            </h2>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-3">
            {isCheckedIn && (
              <span
                className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full"
                style={{
                  background: "oklch(0.68 0.18 148 / 0.15)",
                  color: "oklch(0.68 0.18 148)",
                  border: "1px solid oklch(0.68 0.18 148 / 0.3)",
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Checked In
              </span>
            )}
            {isCheckedOut && (
              <span
                className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full"
                style={{
                  background: "oklch(0.55 0.006 60 / 0.3)",
                  color: "oklch(0.70 0.006 60)",
                  border: "1px solid oklch(0.45 0.006 60)",
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Checked Out
              </span>
            )}
            {!isCheckedIn && !isCheckedOut && !isLoading && (
              <span
                className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full"
                style={{
                  background: "oklch(0.20 0.006 60)",
                  color: "oklch(0.55 0.006 60)",
                  border: "1px solid oklch(0.30 0.006 60)",
                }}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Not Yet In
              </span>
            )}
          </div>

          {/* Timestamps */}
          {todayAttendance?.checkInTime != null && (
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Check-In:</span>{" "}
                {formatNanoTimestamp(todayAttendance.checkInTime)}
              </p>
              {todayAttendance.checkOutTime != null && (
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">
                    Check-Out:
                  </span>{" "}
                  {formatNanoTimestamp(todayAttendance.checkOutTime)}
                </p>
              )}
            </div>
          )}

          {/* Flags — frontend-computed (reliable) */}
          {!staff.isPremium && todayAttendance && (
            <div className="flex flex-wrap gap-2">
              {lateInfo?.isLate && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "oklch(0.60 0.22 22 / 0.15)",
                    color: "oklch(0.70 0.22 22)",
                    border: "1px solid oklch(0.60 0.22 22 / 0.3)",
                  }}
                >
                  Late +{lateInfo.lateMinutes}m
                </span>
              )}
              {overtimeInfo?.isEarlyExit && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "oklch(0.78 0.16 52 / 0.15)",
                    color: "oklch(0.78 0.16 52)",
                    border: "1px solid oklch(0.78 0.16 52 / 0.3)",
                  }}
                >
                  Early Exit
                </span>
              )}
              {overtimeInfo != null && overtimeInfo.overtimeMinutes > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "oklch(0.76 0.15 85 / 0.15)",
                    color: "oklch(0.76 0.15 85)",
                    border: "1px solid oklch(0.76 0.15 85 / 0.3)",
                  }}
                >
                  Extra Time +{overtimeInfo.overtimeMinutes}m
                </span>
              )}
              {!lateInfo?.isLate &&
                !overtimeInfo?.isEarlyExit &&
                !(overtimeInfo != null && overtimeInfo.overtimeMinutes > 0) &&
                todayAttendance.checkInTime != null && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: "oklch(0.68 0.18 148 / 0.1)",
                      color: "oklch(0.68 0.18 148)",
                      border: "1px solid oklch(0.68 0.18 148 / 0.25)",
                    }}
                  >
                    ✓ On Time
                  </span>
                )}
            </div>
          )}
          {staff.isPremium && (
            <p
              className="text-xs"
              style={{ color: "oklch(0.76 0.15 85 / 0.7)" }}
            >
              ✦ Premium staff — flexible schedule, no attendance flags
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              data-ocid="staff_portal.checkin_button"
              onClick={() => checkInMutation.mutate()}
              disabled={
                isCheckedIn ||
                isCheckedOut ||
                checkInMutation.isPending ||
                isLoading
              }
              className="flex-1 font-body font-semibold"
              style={{
                background:
                  isCheckedIn || isCheckedOut
                    ? "oklch(0.20 0.006 60)"
                    : "oklch(0.68 0.18 148)",
                color:
                  isCheckedIn || isCheckedOut
                    ? "oklch(0.40 0.006 60)"
                    : "oklch(0.08 0 0)",
                border: "none",
              }}
            >
              {checkInMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div
                    className="gold-spinner w-4 h-4"
                    style={{
                      borderColor: "transparent",
                      borderTopColor: "currentColor",
                    }}
                  />
                  Checking In…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Check In
                </div>
              )}
            </Button>

            <Button
              data-ocid="staff_portal.checkout_button"
              onClick={() => checkOutMutation.mutate()}
              disabled={!isCheckedIn || checkOutMutation.isPending || isLoading}
              variant="outline"
              className="flex-1 font-body font-semibold border-border"
              style={{
                borderColor: isCheckedIn
                  ? "oklch(0.60 0.22 22 / 0.5)"
                  : undefined,
                color: isCheckedIn ? "oklch(0.60 0.22 22)" : undefined,
              }}
            >
              {checkOutMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div
                    className="gold-spinner w-4 h-4"
                    style={{
                      borderColor: "transparent",
                      borderTopColor: "currentColor",
                    }}
                  />
                  Checking Out…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Check Out
                </div>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Earnings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-6 luxury-card space-y-5"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gold" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Daily Earnings Entry
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="earnings-input"
                className="block text-xs text-muted-foreground mb-2 uppercase tracking-widest"
              >
                Enter Amounts (use + or , to separate)
              </label>
              <Input
                id="earnings-input"
                data-ocid="staff_portal.earnings_input"
                value={displayedEarningsInput}
                onChange={(e) => setEarningsInput(e.target.value)}
                placeholder="e.g. 111+786+654+357"
                className="font-body bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-gold text-base"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Format: 111+786+654 or 111, 786, 654
              </p>
            </div>

            {/* Live total */}
            <AnimatePresence>
              {parsedParts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  data-ocid="staff_portal.earnings_total"
                  className="rounded-lg p-4 text-center"
                  style={{
                    background: "oklch(0.76 0.15 85 / 0.08)",
                    border: "1px solid oklch(0.76 0.15 85 / 0.25)",
                  }}
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Total Earnings Today
                  </p>
                  <p className="font-display text-3xl font-bold gold-text-gradient">
                    ₹{Number(computedTotal).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parsedParts.join(" + ")} ={" "}
                    {Number(computedTotal).toLocaleString()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Saved today's earnings */}
            {todayEarnings && (
              <div
                className="rounded-lg p-3 flex items-center gap-3"
                style={{
                  background: "oklch(0.68 0.18 148 / 0.08)",
                  border: "1px solid oklch(0.68 0.18 148 / 0.25)",
                }}
              >
                <CheckCircle2
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "oklch(0.68 0.18 148)" }}
                />
                <div className="text-sm">
                  <span className="text-foreground font-medium">Saved:</span>{" "}
                  <span className="text-muted-foreground">
                    ₹{Number(todayEarnings.total).toLocaleString()} (
                    {todayEarnings.parts.map(String).join(" + ")})
                  </span>
                </div>
              </div>
            )}

            <Button
              data-ocid="staff_portal.earnings_save_button"
              onClick={() => saveEarningsMutation.mutate()}
              disabled={
                saveEarningsMutation.isPending || parsedParts.length === 0
              }
              className="w-full font-body font-semibold"
              style={{
                background:
                  parsedParts.length > 0
                    ? "oklch(0.76 0.15 85)"
                    : "oklch(0.22 0.006 60)",
                color:
                  parsedParts.length > 0
                    ? "oklch(0.08 0 0)"
                    : "oklch(0.45 0.006 60)",
                border: "none",
              }}
            >
              {saveEarningsMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div
                    className="gold-spinner w-4 h-4"
                    style={{
                      borderColor: "transparent",
                      borderTopColor: "black",
                    }}
                  />
                  Saving…
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Earnings
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
