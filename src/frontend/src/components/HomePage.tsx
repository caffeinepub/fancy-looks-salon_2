import { Crown, Scissors } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import StaffAttendanceTab from "./StaffAttendanceTab";

interface HomePageProps {
  onStaffPortal: () => void;
  onAdminLogin: () => void;
}

type HomeTab = "staff-portal" | "staff-attendance" | "admin-login";

const TABS: { id: HomeTab; label: string }[] = [
  { id: "staff-portal", label: "Staff Portal" },
  { id: "staff-attendance", label: "Staff Attendance" },
  { id: "admin-login", label: "Admin Login" },
];

export default function HomePage({
  onStaffPortal,
  onAdminLogin,
}: HomePageProps) {
  const [activeTab, setActiveTab] = useState<HomeTab>("staff-portal");

  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at top, oklch(0.76 0.15 85) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-0 left-0 w-64 h-64 opacity-5"
          style={{
            background:
              "radial-gradient(ellipse at top left, oklch(0.76 0.15 85), transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 opacity-5"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, oklch(0.76 0.15 85), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.76 0.15 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.76 0.15 85) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header: branding */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center pt-8 pb-4 px-6"
      >
        {/* Logo */}
        <div className="relative mb-4">
          <div
            className="w-20 h-20 rounded-full overflow-hidden mx-auto"
            style={{
              border: "2px solid oklch(0.76 0.15 85 / 0.6)",
              boxShadow:
                "0 0 30px oklch(0.76 0.15 85 / 0.25), 0 0 60px oklch(0.76 0.15 85 / 0.1)",
            }}
          >
            <img
              src="/assets/uploads/IMG_20251223_151630-1.jpg"
              alt="Fancy Looks Salon Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute -inset-2 rounded-full pointer-events-none"
            style={{ border: "1px dashed oklch(0.76 0.15 85 / 0.2)" }}
          />
        </div>

        {/* Salon name */}
        <div className="space-y-0.5 text-center">
          <div className="flex items-center gap-2 justify-center mb-1">
            <div
              className="h-px w-12"
              style={{
                background:
                  "linear-gradient(to right, transparent, oklch(0.76 0.15 85 / 0.5))",
              }}
            />
            <Scissors className="w-3.5 h-3.5 text-gold opacity-60" />
            <div
              className="h-px w-12"
              style={{
                background:
                  "linear-gradient(to left, transparent, oklch(0.76 0.15 85 / 0.5))",
              }}
            />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight gold-text-gradient leading-none">
            Fancy Looks
          </h1>
          <h2 className="font-display text-sm font-light tracking-[0.3em] text-gold uppercase">
            Salon
          </h2>
          <div className="flex items-center gap-2 justify-center mt-1">
            <div
              className="h-px w-12"
              style={{
                background:
                  "linear-gradient(to right, transparent, oklch(0.76 0.15 85 / 0.5))",
              }}
            />
            <Crown className="w-2.5 h-2.5 text-gold opacity-50" />
            <div
              className="h-px w-12"
              style={{
                background:
                  "linear-gradient(to left, transparent, oklch(0.76 0.15 85 / 0.5))",
              }}
            />
          </div>
        </div>
      </motion.header>

      {/* Tab navigation */}
      <motion.nav
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex justify-center px-4 pt-2 pb-0"
        aria-label="Main navigation"
      >
        <div
          className="flex gap-1 p-1 rounded-2xl w-full max-w-lg"
          style={{
            background: "oklch(0.16 0.006 60)",
            border: "1px solid oklch(0.76 0.15 85 / 0.15)",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-ocid={`home.${tab.id}.tab`}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 text-xs sm:text-sm font-semibold py-2.5 rounded-xl transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                style={{
                  color: isActive
                    ? "oklch(0.10 0.006 60)"
                    : "oklch(0.55 0.01 80)",
                  background: isActive ? "oklch(0.76 0.15 85)" : "transparent",
                  boxShadow: isActive
                    ? "0 2px 10px oklch(0.76 0.15 85 / 0.35)"
                    : "none",
                }}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="home-tab-indicator"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "oklch(0.76 0.15 85)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.nav>

      {/* Tab content */}
      <main className="relative z-10 flex-1 px-4 pt-5 pb-6 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === "staff-portal" && (
            <motion.div
              key="staff-portal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center pt-10"
            >
              <motion.button
                data-ocid="home.staff_portal_button"
                onClick={onStaffPortal}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative rounded-xl overflow-hidden p-px cursor-pointer w-full max-w-sm"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.76 0.15 85 / 0.6), oklch(0.76 0.15 85 / 0.2), oklch(0.76 0.15 85 / 0.6))",
                }}
              >
                <div
                  className="rounded-xl p-8 text-center transition-all duration-300 flex flex-col items-center gap-4"
                  style={{ background: "oklch(0.12 0.006 60)" }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "oklch(0.76 0.15 85 / 0.15)",
                      border: "1px solid oklch(0.76 0.15 85 / 0.4)",
                    }}
                  >
                    <Scissors className="w-7 h-7 text-gold" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold text-gold">
                      Staff Portal
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check-In · Check-Out · Earnings
                    </p>
                  </div>
                  <div
                    className="text-xs px-4 py-1.5 rounded-full font-medium"
                    style={{
                      background: "oklch(0.76 0.15 85 / 0.12)",
                      color: "oklch(0.76 0.15 85)",
                      border: "1px solid oklch(0.76 0.15 85 / 0.25)",
                    }}
                  >
                    Enter your password to continue →
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}

          {activeTab === "staff-attendance" && (
            <motion.div
              key="staff-attendance"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <StaffAttendanceTab />
            </motion.div>
          )}

          {activeTab === "admin-login" && (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center pt-10"
            >
              <motion.button
                data-ocid="home.admin_login_button"
                onClick={onAdminLogin}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative rounded-xl overflow-hidden p-px cursor-pointer w-full max-w-sm"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.45 0.006 60), oklch(0.26 0.006 60), oklch(0.45 0.006 60))",
                }}
              >
                <div
                  className="rounded-xl p-8 text-center transition-all duration-300 flex flex-col items-center gap-4"
                  style={{ background: "oklch(0.12 0.006 60)" }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "oklch(0.22 0.008 60)",
                      border: "1px solid oklch(0.40 0.006 60)",
                    }}
                  >
                    <Crown
                      className="w-7 h-7"
                      style={{ color: "oklch(0.70 0.08 75)" }}
                    />
                  </div>
                  <div>
                    <p
                      className="font-display text-xl font-semibold"
                      style={{ color: "oklch(0.80 0.008 75)" }}
                    >
                      Admin Login
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dashboard · Analytics · Management
                    </p>
                  </div>
                  <div
                    className="text-xs px-4 py-1.5 rounded-full font-medium"
                    style={{
                      background: "oklch(0.22 0.008 60)",
                      color: "oklch(0.65 0.006 60)",
                      border: "1px solid oklch(0.35 0.006 60)",
                    }}
                  >
                    Admin access required →
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="relative z-10 text-center pb-5"
      >
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built by Sumit
        </p>
      </motion.footer>
    </div>
  );
}
