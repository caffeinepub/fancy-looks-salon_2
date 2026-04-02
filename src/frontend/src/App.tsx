import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import type { StaffProfile } from "./backend.d";
import AdminDashboard from "./components/AdminDashboard";
import AdminLoginPage from "./components/AdminLoginPage";
import HomePage from "./components/HomePage";
import StaffLoginPage from "./components/StaffLoginPage";
import StaffPortalPage from "./components/StaffPortalPage";
import StaffSelectionPage from "./components/StaffSelectionPage";

export type AppView =
  | "home"
  | "staff-selection"
  | "staff-login"
  | "staff-portal"
  | "admin-login"
  | "admin-dashboard";

const REMEMBER_KEY = "fls_remembered_staff";

function App() {
  const [view, setView] = useState<AppView>("home");
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const navigateTo = (target: AppView) => setView(target);

  // Staff selects their profile card -> go to staff login page
  const handleStaffSelect = (staff: StaffProfile) => {
    setSelectedStaff(staff);
    // Check if this staff is remembered (already logged in)
    const rememberedId = localStorage.getItem(REMEMBER_KEY);
    if (rememberedId && rememberedId === String(staff.id)) {
      // Skip login, go straight to portal
      setView("staff-portal");
    } else {
      setView("staff-login");
    }
  };

  // Staff enters correct password -> go to portal
  const handleStaffLoginSuccess = (staff: StaffProfile) => {
    setSelectedStaff(staff);
    setView("staff-portal");
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setView("admin-dashboard");
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setView("home");
  };

  // When leaving staff portal, clear remembered state is NOT done automatically
  // (remembered stays until they explicitly uncheck or log out)
  const handleStaffPortalBack = () => {
    setView("staff-selection");
  };

  return (
    <div className="min-h-screen bg-background font-body">
      {view === "home" && (
        <HomePage
          onStaffPortal={() => navigateTo("staff-selection")}
          onAdminLogin={() => navigateTo("admin-login")}
        />
      )}
      {view === "staff-selection" && (
        <StaffSelectionPage
          onBack={() => navigateTo("home")}
          onSelectStaff={handleStaffSelect}
        />
      )}
      {view === "staff-login" && selectedStaff && (
        <StaffLoginPage
          staff={selectedStaff}
          onBack={() => navigateTo("staff-selection")}
          onSuccess={handleStaffLoginSuccess}
        />
      )}
      {view === "staff-portal" && selectedStaff && (
        <StaffPortalPage staff={selectedStaff} onBack={handleStaffPortalBack} />
      )}
      {view === "admin-login" && (
        <AdminLoginPage
          onBack={() => navigateTo("home")}
          onSuccess={handleAdminLogin}
        />
      )}
      {view === "admin-dashboard" && isAdminAuthenticated && (
        <AdminDashboard onLogout={handleAdminLogout} />
      )}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(0.16 0.006 60)",
            border: "1px solid oklch(0.76 0.15 85 / 0.3)",
            color: "oklch(0.96 0.012 85)",
          },
        }}
      />
    </div>
  );
}

export default App;
