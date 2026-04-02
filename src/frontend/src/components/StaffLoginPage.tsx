import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Scissors,
  UserCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { StaffProfile, backendInterface } from "../backend.d";
import { useActor } from "../hooks/useActor";

const REMEMBER_KEY = "fls_remembered_staff";

interface StaffLoginPageProps {
  staff: StaffProfile;
  onBack: () => void;
  onSuccess: (staff: StaffProfile) => void;
}

export default function StaffLoginPage({
  staff,
  onBack,
  onSuccess,
}: StaffLoginPageProps) {
  const { actor } = useActor();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem(REMEMBER_KEY) === String(staff.id),
  );

  const { data: hasPassword, isLoading: checkingPassword } = useQuery({
    queryKey: ["hasStaffPassword", String(staff.id)],
    queryFn: async () => {
      if (!actor) return false;
      return (actor as unknown as backendInterface).hasStaffPassword(staff.id);
    },
    enabled: !!actor,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return (actor as unknown as backendInterface).verifyStaffPassword(
        staff.id,
        password,
      );
    },
    onSuccess: (isValid: boolean) => {
      if (isValid) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, String(staff.id));
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
        onSuccess(staff);
      } else {
        setErrorMsg("ভুল password। আবার চেষ্টা করুন।");
      }
    },
    onError: () => {
      setErrorMsg("যাচাই করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!password.trim()) {
      setErrorMsg("Password দিন।");
      return;
    }
    verifyMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.76 0.15 85 / 0.05) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.76 0.15 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.76 0.15 85) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Back button */}
      <motion.button
        onClick={onBack}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      {/* Brand */}
      <div className="absolute top-5 right-6 flex items-center gap-2 z-10">
        <img
          src="/assets/uploads/IMG_20251223_151630-1.jpg"
          className="w-6 h-6 rounded-full object-cover"
          alt="logo"
        />
        <span className="font-display text-gold text-sm font-semibold tracking-wide">
          Fancy Looks Salon
        </span>
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: "oklch(0.13 0.006 60)",
            border: "1px solid oklch(0.76 0.15 85 / 0.2)",
            boxShadow:
              "0 0 40px oklch(0.76 0.15 85 / 0.08), 0 20px 60px oklch(0 0 0 / 0.5)",
          }}
        >
          {/* Staff photo */}
          <div className="flex flex-col items-center gap-3 mb-7">
            <div
              className="w-20 h-20 rounded-full overflow-hidden"
              style={{
                border: "2px solid oklch(0.76 0.15 85 / 0.45)",
                boxShadow: "0 0 24px oklch(0.76 0.15 85 / 0.18)",
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
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {staff.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {staff.shiftStart} – {staff.shiftEnd}
              </p>
              {staff.isPremium && (
                <span
                  className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full"
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
          </div>

          {/* Password area */}
          {checkingPassword ? (
            <div className="flex items-center justify-center py-6">
              <div className="gold-spinner" />
            </div>
          ) : hasPassword === false ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-4 flex items-start gap-3"
              style={{
                background: "oklch(0.60 0.15 60 / 0.12)",
                border: "1px solid oklch(0.60 0.15 60 / 0.35)",
              }}
            >
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground font-medium">
                  Password সেট করা হয়নি
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Admin-এর সাথে যোগাযোগ করুন।
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="staff-password-input"
                  className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="staff-password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="আপনার password দিন"
                    className="font-body bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                    style={
                      errorMsg
                        ? { borderColor: "oklch(0.60 0.22 22 / 0.7)" }
                        : undefined
                    }
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {errorMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-sm flex items-center gap-1.5"
                      style={{ color: "oklch(0.65 0.22 22)" }}
                    >
                      <span>✕</span>
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Remember me checkbox */}
              <label
                htmlFor="remember-me-checkbox"
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                <input
                  id="remember-me-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div
                  aria-hidden="true"
                  className="relative w-4 h-4 flex-shrink-0 rounded"
                  style={{
                    border: rememberMe
                      ? "2px solid oklch(0.76 0.15 85)"
                      : "2px solid oklch(0.40 0.010 70)",
                    background: rememberMe
                      ? "oklch(0.76 0.15 85)"
                      : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {rememberMe && (
                    <svg
                      aria-hidden="true"
                      role="img"
                      className="absolute inset-0 m-auto w-2.5 h-2.5"
                      viewBox="0 0 10 8"
                      fill="none"
                    >
                      <title>চেকমার্ক</title>
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="oklch(0.08 0 0)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className="text-xs transition-colors"
                  style={{
                    color: rememberMe
                      ? "oklch(0.76 0.15 85)"
                      : "oklch(0.55 0.010 70)",
                  }}
                >
                  আমাকে মনে রাখুন (পরের বার password লাগবে না)
                </span>
              </label>

              <Button
                type="submit"
                disabled={verifyMutation.isPending}
                className="w-full font-body font-semibold h-11"
                style={{
                  background: "oklch(0.76 0.15 85)",
                  color: "oklch(0.08 0 0)",
                  border: "none",
                }}
              >
                {verifyMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="gold-spinner w-4 h-4"
                      style={{
                        borderColor: "transparent",
                        borderTopColor: "oklch(0.08 0 0)",
                      }}
                    />
                    যাচাই হচ্ছে…
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    প্রবেশ করুন
                  </div>
                )}
              </Button>
            </form>
          )}
        </div>

        <div className="flex items-center gap-3 mt-8 px-4">
          <div
            className="h-px flex-1"
            style={{ background: "oklch(0.26 0.010 70 / 0.5)" }}
          />
          <Scissors className="w-3 h-3 text-gold opacity-30" />
          <div
            className="h-px flex-1"
            style={{ background: "oklch(0.26 0.010 70 / 0.5)" }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Staff Portal — Fancy Looks Salon
        </p>
      </motion.div>
    </div>
  );
}
