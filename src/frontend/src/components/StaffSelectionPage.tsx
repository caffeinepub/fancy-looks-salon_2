import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface StaffSelectionPageProps {
  onBack: () => void;
  onSelectStaff: (staff: StaffProfile) => void;
}

// Password modal dialog for staff profile access
function StaffPasswordDialog({
  staff,
  open,
  onClose,
  onSuccess,
}: {
  staff: StaffProfile | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (staff: StaffProfile) => void;
}) {
  const { actor } = useActor();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Check if password is set for this staff
  const { data: hasPassword, isLoading: checkingPassword } = useQuery({
    queryKey: ["hasStaffPassword", staff?.id ? String(staff.id) : null],
    queryFn: async () => {
      if (!actor || !staff) return false;
      return (actor as unknown as backendInterface).hasStaffPassword(staff.id);
    },
    enabled: !!actor && !!staff && open,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !staff) throw new Error("Not connected");
      return (actor as unknown as backendInterface).verifyStaffPassword(
        staff.id,
        password,
      );
    },
    onSuccess: (isValid: boolean) => {
      if (isValid) {
        if (staff) onSuccess(staff);
      } else {
        setErrorMsg("ভুল password। আবার চেষ্টা করুন।");
      }
    },
    onError: () => {
      setErrorMsg("যাচাই করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    },
  });

  const handleClose = () => {
    setPassword("");
    setErrorMsg("");
    setShowPassword(false);
    onClose();
  };

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
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="staff_password.dialog"
        className="max-w-sm font-body"
        style={{
          background: "oklch(0.13 0.006 60)",
          border: "1px solid oklch(0.76 0.15 85 / 0.25)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground sr-only">
            Staff Password
          </DialogTitle>
        </DialogHeader>

        {/* Staff info */}
        <div className="flex flex-col items-center gap-3 pt-2 pb-2">
          <div
            className="w-20 h-20 rounded-full overflow-hidden"
            style={{
              border: "2px solid oklch(0.76 0.15 85 / 0.4)",
              boxShadow: "0 0 20px oklch(0.76 0.15 85 / 0.15)",
            }}
          >
            {staff?.photoUrl ? (
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
            <p className="font-display font-bold text-lg text-foreground">
              {staff?.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {staff?.shiftStart} – {staff?.shiftEnd}
            </p>
          </div>
        </div>

        {/* Password area */}
        {checkingPassword ? (
          <div
            data-ocid="staff_password.loading_state"
            className="flex items-center justify-center py-6"
          >
            <div className="gold-spinner" />
          </div>
        ) : hasPassword === false ? (
          // No password set
          <motion.div
            data-ocid="staff_password.error_state"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg p-4 flex items-start gap-3 mb-2"
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
          // Password form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest">
                Password
              </Label>
              <div className="relative">
                <Input
                  data-ocid="staff_password.input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="আপনার password দিন"
                  className="bg-input border-border text-foreground pr-10"
                  autoFocus
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
                    data-ocid="staff_password.error_state"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs mt-1"
                    style={{ color: "oklch(0.65 0.22 22)" }}
                  >
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                data-ocid="staff_password.cancel_button"
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1 font-body text-muted-foreground hover:text-foreground"
              >
                বাতিল
              </Button>
              <Button
                data-ocid="staff_password.submit_button"
                type="submit"
                disabled={verifyMutation.isPending}
                className="flex-1 font-body font-semibold"
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
                      style={{ borderTopColor: "black" }}
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
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StaffCard({
  staff,
  index,
  onSelect,
}: {
  staff: StaffProfile;
  index: number;
  onSelect: () => void;
}) {
  const ocidIndex = index + 1;

  return (
    <motion.button
      data-ocid={`staff_select.item.${ocidIndex}`}
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="group relative rounded-xl overflow-hidden p-px cursor-pointer text-left w-full"
      style={{
        background: "oklch(0.26 0.010 70 / 0.5)",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.76 0.15 85 / 0.3) 0%, transparent 60%)",
        }}
      />
      <div
        className="relative rounded-xl p-5 flex flex-col items-center gap-4 transition-all duration-300"
        style={{ background: "oklch(0.14 0.006 60)" }}
      >
        {/* Lock indicator */}
        <div className="absolute top-3 right-3">
          <Lock
            className="w-3 h-3 opacity-40 group-hover:opacity-70 transition-opacity"
            style={{ color: "oklch(0.76 0.15 85)" }}
          />
        </div>

        {/* Photo */}
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full overflow-hidden"
            style={{
              border: "2px solid oklch(0.76 0.15 85 / 0.3)",
              boxShadow: "0 0 15px oklch(0.76 0.15 85 / 0.15)",
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

        {/* Name */}
        <div className="text-center">
          <p className="font-display font-semibold text-base text-foreground group-hover:text-gold transition-colors duration-300 truncate max-w-[140px]">
            {staff.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {staff.shiftStart} – {staff.shiftEnd}
          </p>
          {staff.isPremium && (
            <span
              className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
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
    </motion.button>
  );
}

export default function StaffSelectionPage({
  onBack,
  onSelectStaff,
}: StaffSelectionPageProps) {
  const { actor, isFetching } = useActor();
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const {
    data: staffList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allStaff"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllStaff();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const activeStaff = staffList?.filter((s) => s.isActive) ?? [];

  const handleStaffClick = (staff: StaffProfile) => {
    setSelectedStaff(staff);
    setPasswordDialogOpen(true);
  };

  const handlePasswordSuccess = (staff: StaffProfile) => {
    setPasswordDialogOpen(false);
    setSelectedStaff(null);
    onSelectStaff(staff);
  };

  const handlePasswordClose = () => {
    setPasswordDialogOpen(false);
    setSelectedStaff(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-8 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, oklch(0.76 0.15 85 / 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border px-6 py-4 flex items-center gap-4">
        <motion.button
          data-ocid="staff_select.back_button"
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

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Select <span className="gold-text-gradient">Your Profile</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Choose your name to access the staff portal
          </p>
        </motion.div>

        {/* Loading state */}
        {(isLoading || isFetching) && (
          <div
            data-ocid="staff_select.loading_state"
            className="flex flex-col items-center gap-4 py-16"
          >
            <div className="gold-spinner" />
            <p className="text-sm text-muted-foreground">
              Loading staff profiles…
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div
            data-ocid="staff_select.error_state"
            className="text-center py-16 space-y-3"
          >
            <p className="text-destructive text-sm">
              Failed to load staff profiles.
            </p>
            <p className="text-muted-foreground text-xs">Please try again.</p>
          </div>
        )}

        {/* Staff grid */}
        {!isLoading && !error && activeStaff.length === 0 ? (
          <motion.div
            data-ocid="staff_select.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: "oklch(0.16 0.006 60)",
                border: "1px solid oklch(0.26 0.010 70)",
              }}
            >
              <UserCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-display text-foreground text-lg">
              No Staff Profiles Found
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Ask your admin to add staff profiles.
            </p>
          </motion.div>
        ) : null}
        {!isLoading && !error && activeStaff.length > 0 && (
          <motion.div
            data-ocid="staff_select.list"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {activeStaff.map((staff, index) => (
              <StaffCard
                key={String(staff.id)}
                staff={staff}
                index={index}
                onSelect={() => handleStaffClick(staff)}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Password Dialog */}
      <StaffPasswordDialog
        staff={selectedStaff}
        open={passwordDialogOpen}
        onClose={handlePasswordClose}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
}
