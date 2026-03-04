import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, LogOut, Scissors } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import AnalyticsTab from "./admin/AnalyticsTab";
import LiveStatusTab from "./admin/LiveStatusTab";
import MonthlySummaryTab from "./admin/MonthlySummaryTab";
import NotificationsTab from "./admin/NotificationsTab";
import StaffManagementTab from "./admin/StaffManagementTab";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("live-status");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header
        className="border-b border-border px-4 md:px-8 py-3.5 flex items-center gap-4 sticky top-0 z-40"
        style={{
          background: "oklch(0.10 0.003 60 / 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.76 0.15 85 / 0.15)",
              border: "1px solid oklch(0.76 0.15 85 / 0.35)",
            }}
          >
            <Scissors className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="font-display text-gold font-semibold text-base tracking-wide hidden sm:block">
            Fancy Looks Salon
          </span>
        </div>

        <div className="flex-1" />

        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: "oklch(0.76 0.15 85 / 0.1)",
            border: "1px solid oklch(0.76 0.15 85 / 0.25)",
            color: "oklch(0.76 0.15 85)",
          }}
        >
          <Crown className="w-3 h-3" />
          Admin
        </div>

        <Button
          data-ocid="admin.logout_button"
          onClick={onLogout}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 font-body text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </header>

      {/* Dashboard content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          {/* Dashboard heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Admin <span className="gold-text-gradient">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList
              className="w-full grid grid-cols-5 mb-6 h-auto p-1 gap-1"
              style={{
                background: "oklch(0.13 0.006 60)",
                border: "1px solid oklch(0.26 0.010 70)",
              }}
            >
              <TabsTrigger
                data-ocid="admin.live_status_tab"
                value="live-status"
                className="text-xs md:text-sm font-body py-2 data-[state=active]:bg-gold data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
              >
                <span className="hidden md:inline">Live Status</span>
                <span className="md:hidden">Live</span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.analytics_tab"
                value="analytics"
                className="text-xs md:text-sm font-body py-2 data-[state=active]:bg-gold data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.monthly_summary_tab"
                value="monthly-summary"
                className="text-xs md:text-sm font-body py-2 data-[state=active]:bg-gold data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
              >
                <span className="hidden md:inline">Monthly</span>
                <span className="md:hidden">Month</span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.staff_management_tab"
                value="staff-management"
                className="text-xs md:text-sm font-body py-2 data-[state=active]:bg-gold data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
              >
                <span className="hidden md:inline">Staff Mgmt</span>
                <span className="md:hidden">Staff</span>
              </TabsTrigger>
              <TabsTrigger
                data-ocid="admin.notifications_tab"
                value="notifications"
                className="text-xs md:text-sm font-body py-2 data-[state=active]:bg-gold data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:text-muted-foreground"
              >
                <span className="hidden md:inline">Notifications</span>
                <span className="md:hidden">Notifs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live-status" className="mt-0">
              <LiveStatusTab />
            </TabsContent>
            <TabsContent value="analytics" className="mt-0">
              <AnalyticsTab />
            </TabsContent>
            <TabsContent value="monthly-summary" className="mt-0">
              <MonthlySummaryTab />
            </TabsContent>
            <TabsContent value="staff-management" className="mt-0">
              <StaffManagementTab />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
