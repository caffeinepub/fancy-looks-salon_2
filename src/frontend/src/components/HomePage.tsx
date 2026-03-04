import { Crown, Scissors } from "lucide-react";
import { motion } from "motion/react";

interface HomePageProps {
  onStaffPortal: () => void;
  onAdminLogin: () => void;
}

export default function HomePage({
  onStaffPortal,
  onAdminLogin,
}: HomePageProps) {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial gold glow center */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, oklch(0.76 0.15 85) 0%, transparent 70%)",
          }}
        />
        {/* Top-left corner ornament */}
        <div
          className="absolute top-0 left-0 w-64 h-64 opacity-5"
          style={{
            background:
              "radial-gradient(ellipse at top left, oklch(0.76 0.15 85), transparent 60%)",
          }}
        />
        {/* Bottom-right corner ornament */}
        <div
          className="absolute bottom-0 right-0 w-64 h-64 opacity-5"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, oklch(0.76 0.15 85), transparent 60%)",
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.76 0.15 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.76 0.15 85) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center mx-auto relative"
            style={{
              background: "oklch(0.16 0.006 60)",
              border: "2px solid oklch(0.76 0.15 85 / 0.6)",
              boxShadow:
                "0 0 40px oklch(0.76 0.15 85 / 0.3), 0 0 80px oklch(0.76 0.15 85 / 0.15)",
            }}
          >
            <img
              src="/assets/generated/fancy-looks-logo-transparent.dim_200x200.png"
              alt="Fancy Looks Salon Logo"
              className="w-20 h-20 object-contain"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="oklch(0.76 0.15 85)" stroke-width="1.5"><path d="M6 3a2 2 0 0 1 2 2v7.17A6 6 0 0 1 6 20a6 6 0 0 1-2-11.83V5a2 2 0 0 1 2-2Zm12 0a2 2 0 0 1 2 2v7.17A6 6 0 0 1 18 20a6 6 0 0 1-2-11.83V5a2 2 0 0 1 2-2Z"/></svg>`;
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          {/* Rotating ornament ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="absolute -inset-3 rounded-full pointer-events-none"
            style={{
              border: "1px dashed oklch(0.76 0.15 85 / 0.25)",
            }}
          />
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3 justify-center">
            <div
              className="h-px flex-1 max-w-16"
              style={{
                background:
                  "linear-gradient(to right, transparent, oklch(0.76 0.15 85 / 0.6))",
              }}
            />
            <Scissors className="w-4 h-4 text-gold opacity-60" />
            <div
              className="h-px flex-1 max-w-16"
              style={{
                background:
                  "linear-gradient(to left, transparent, oklch(0.76 0.15 85 / 0.6))",
              }}
            />
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight gold-text-gradient leading-none">
            Fancy Looks
          </h1>
          <h2 className="font-display text-2xl md:text-3xl font-light tracking-[0.25em] text-gold uppercase">
            Salon
          </h2>
          <div className="flex items-center gap-3 justify-center mt-1">
            <div
              className="h-px flex-1 max-w-16"
              style={{
                background:
                  "linear-gradient(to right, transparent, oklch(0.76 0.15 85 / 0.6))",
              }}
            />
            <Crown className="w-3 h-3 text-gold opacity-60" />
            <div
              className="h-px flex-1 max-w-16"
              style={{
                background:
                  "linear-gradient(to left, transparent, oklch(0.76 0.15 85 / 0.6))",
              }}
            />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-foreground text-sm tracking-widest uppercase font-body"
        >
          Elegance · Precision · Excellence
        </motion.p>

        {/* Portal cards */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-4"
        >
          {/* Staff Portal */}
          <motion.button
            data-ocid="home.staff_portal_button"
            onClick={onStaffPortal}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative rounded-lg overflow-hidden p-px cursor-pointer"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.76 0.15 85 / 0.6), oklch(0.76 0.15 85 / 0.2), oklch(0.76 0.15 85 / 0.6))",
            }}
          >
            <div
              className="rounded-lg p-6 text-center transition-all duration-300 group-hover:bg-opacity-90 h-full flex flex-col items-center gap-3"
              style={{ background: "oklch(0.12 0.006 60)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: "oklch(0.76 0.15 85 / 0.15)",
                  border: "1px solid oklch(0.76 0.15 85 / 0.4)",
                }}
              >
                <Scissors className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-gold">
                  Staff Portal
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check-In · Earnings
                </p>
              </div>
              <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.button>

          {/* Admin Login */}
          <motion.button
            data-ocid="home.admin_login_button"
            onClick={onAdminLogin}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative rounded-lg overflow-hidden p-px cursor-pointer"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.45 0.006 60), oklch(0.26 0.006 60), oklch(0.45 0.006 60))",
            }}
          >
            <div
              className="rounded-lg p-6 text-center transition-all duration-300 h-full flex flex-col items-center gap-3"
              style={{ background: "oklch(0.12 0.006 60)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: "oklch(0.22 0.008 60)",
                  border: "1px solid oklch(0.40 0.006 60)",
                }}
              >
                <Crown
                  className="w-5 h-5"
                  style={{ color: "oklch(0.70 0.08 75)" }}
                />
              </div>
              <div>
                <p
                  className="font-display text-lg font-semibold"
                  style={{ color: "oklch(0.80 0.008 75)" }}
                >
                  Admin Login
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dashboard · Analytics
                </p>
              </div>
              <div
                className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "oklch(0.70 0.08 75)" }}
              />
            </div>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-xs text-muted-foreground mt-6"
        >
          © {new Date().getFullYear()}. Built by Sumit
        </motion.p>
      </div>
    </div>
  );
}
