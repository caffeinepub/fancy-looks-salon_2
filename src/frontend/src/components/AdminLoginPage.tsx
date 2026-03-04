import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Crown, Eye, EyeOff, Lock, Scissors } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

interface AdminLoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AdminLoginPage({
  onBack,
  onSuccess,
}: AdminLoginPageProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { actor } = useActor();

  const FALLBACK_PASSWORD = "Fancy0308";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Please enter the admin password.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      let result = false;
      if (actor) {
        try {
          result = await actor.verifyAdminPassword(password);
        } catch (_backendErr) {
          // Backend unavailable — fall back to local check
          result = password === FALLBACK_PASSWORD;
        }
      } else {
        // Actor not yet ready — use local fallback
        result = password === FALLBACK_PASSWORD;
      }
      if (result) {
        toast.success("Welcome, Admin!");
        onSuccess();
      } else {
        setErrorMsg("Incorrect password. Please try again.");
      }
    } catch (_err) {
      setErrorMsg("Authentication failed. Please try again.");
      toast.error("Login error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.76 0.15 85 / 0.04) 0%, transparent 65%)",
        }}
      />
      {/* Subtle grid */}
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
        data-ocid="admin_login.back_button"
        onClick={onBack}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      {/* Salon brand */}
      <div className="absolute top-5 right-6 flex items-center gap-2 z-10">
        <Scissors className="w-4 h-4 text-gold" />
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
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.76 0.15 85 / 0.12)",
                border: "1px solid oklch(0.76 0.15 85 / 0.35)",
                boxShadow: "0 0 20px oklch(0.76 0.15 85 / 0.15)",
              }}
            >
              <Crown className="w-7 h-7 text-gold" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Admin Access
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Enter your admin password to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="admin-password-input"
                className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"
              >
                <Lock className="w-3 h-3" />
                Password
              </label>
              <div className="relative">
                <Input
                  id="admin-password-input"
                  data-ocid="admin_login.password_input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Enter admin password"
                  className="font-body bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                  style={
                    errorMsg
                      ? { borderColor: "oklch(0.60 0.22 22 / 0.7)" }
                      : undefined
                  }
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Error message */}
              {errorMsg && (
                <motion.p
                  data-ocid="admin_login.error_state"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm flex items-center gap-1.5"
                  style={{ color: "oklch(0.65 0.22 22)" }}
                >
                  <span>✕</span>
                  {errorMsg}
                </motion.p>
              )}
            </div>

            <Button
              data-ocid="admin_login.submit_button"
              type="submit"
              disabled={isLoading}
              className="w-full font-body font-semibold h-11"
              style={{
                background: "oklch(0.76 0.15 85)",
                color: "oklch(0.08 0 0)",
                border: "none",
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div
                    className="gold-spinner w-4 h-4"
                    style={{
                      borderColor: "transparent",
                      borderTopColor: "oklch(0.08 0 0)",
                    }}
                  />
                  Authenticating…
                </div>
              ) : (
                "Enter Dashboard"
              )}
            </Button>
          </form>
        </div>

        {/* Decorative line */}
        <div className="flex items-center gap-3 mt-8 px-4">
          <div
            className="h-px flex-1"
            style={{ background: "oklch(0.26 0.010 70 / 0.5)" }}
          />
          <Crown className="w-3 h-3 text-gold opacity-30" />
          <div
            className="h-px flex-1"
            style={{ background: "oklch(0.26 0.010 70 / 0.5)" }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Authorized Personnel Only
        </p>
      </motion.div>
    </div>
  );
}
