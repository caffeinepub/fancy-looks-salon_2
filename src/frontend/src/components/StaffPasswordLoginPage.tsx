import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Lock, Scissors } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { StaffProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

const REMEMBER_KEY = "fls_remembered_staff";

interface StaffPasswordLoginPageProps {
  onBack: () => void;
  onSuccess: (staff: StaffProfile) => void;
}

export default function StaffPasswordLoginPage({
  onBack,
  onSuccess,
}: StaffPasswordLoginPageProps) {
  const { actor, isFetching } = useActor();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const rememberedId = localStorage.getItem(REMEMBER_KEY);

  // Auto-login if remembered staff
  const { isLoading: checkingRemembered } = useQuery({
    queryKey: ["rememberedStaff", rememberedId],
    queryFn: async () => {
      if (!actor || !rememberedId) return null;
      try {
        const staff = await actor.getStaffById(BigInt(rememberedId));
        if (staff) {
          onSuccess(staff);
        }
        return staff;
      } catch {
        // Remembered staff not found; clear it
        localStorage.removeItem(REMEMBER_KEY);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!rememberedId,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      // findStaffByPassword returns bigint | null
      const staffId = await actor.findStaffByPassword(password);
      // null means no staff found with this password
      if (staffId === null || staffId === undefined) {
        return null;
      }
      const staff = await actor.getStaffById(staffId);
      return staff ?? null;
    },
    onSuccess: (staff: StaffProfile | null) => {
      if (staff) {
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
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (
        lower.includes("stopped") ||
        lower.includes("unavailable") ||
        lower.includes("503") ||
        lower.includes("canister")
      ) {
        setErrorMsg("সার্ভার সাময়িকভাবে বন্ধ। একটু পরে আবার চেষ্টা করুন।");
      } else {
        setErrorMsg("যাচাই করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!password.trim()) {
      setErrorMsg("Password দিন।");
      return;
    }
    loginMutation.mutate();
  };

  const isLoading = checkingRemembered && !!rememberedId;

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
        data-ocid="staff_portal.link"
        onClick={onBack}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        {/* Logo + branding */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-20 h-20 rounded-full overflow-hidden"
            style={{
              border: "2px solid oklch(0.76 0.15 85 / 0.5)",
              boxShadow:
                "0 0 30px oklch(0.76 0.15 85 / 0.2), 0 0 60px oklch(0.76 0.15 85 / 0.08)",
            }}
          >
            <img
              src="/assets/uploads/IMG_20251223_151630-1.jpg"
              alt="Fancy Looks Salon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1
              className="font-display text-2xl font-bold tracking-wide"
              style={{ color: "oklch(0.76 0.15 85)" }}
            >
              Fancy Looks Salon
            </h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
              Staff Portal
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-8"
          data-ocid="staff_portal.card"
          style={{
            background: "oklch(0.13 0.006 60)",
            border: "1px solid oklch(0.76 0.15 85 / 0.2)",
            boxShadow:
              "0 0 40px oklch(0.76 0.15 85 / 0.08), 0 20px 60px oklch(0 0 0 / 0.5)",
          }}
        >
          {isLoading ? (
            <div
              className="flex flex-col items-center justify-center py-10 gap-4"
              data-ocid="staff_portal.loading_state"
            >
              <div className="gold-spinner" />
              <p className="text-sm text-muted-foreground">লোড হচ্ছে…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-2">
                <h2
                  className="text-lg font-display font-semibold text-center"
                  style={{ color: "oklch(0.92 0.012 85)" }}
                >
                  Staff Login
                </h2>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  আপনার password দিয়ে প্রবেশ করুন
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="staff-portal-password"
                  className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"
                >
                  <Lock className="w-3 h-3" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="staff-portal-password"
                    data-ocid="staff_portal.input"
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
                      data-ocid="staff_portal.error_state"
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

              {/* Remember me */}
              <label
                htmlFor="portal-remember-me"
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                <input
                  id="portal-remember-me"
                  data-ocid="staff_portal.checkbox"
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
                data-ocid="staff_portal.submit_button"
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full font-body font-semibold h-11"
                style={{
                  background: "oklch(0.76 0.15 85)",
                  color: "oklch(0.08 0 0)",
                  border: "none",
                }}
              >
                {loginMutation.isPending ? (
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
