import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Crown, Scissors, UserCircle2 } from "lucide-react";
import { motion } from "motion/react";
import type { StaffProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface StaffSelectionPageProps {
  onBack: () => void;
  onSelectStaff: (staff: StaffProfile) => void;
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
                onSelect={() => onSelectStaff(staff)}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
