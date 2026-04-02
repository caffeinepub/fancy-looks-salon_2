# Fancy Looks Salon

## Current State

- Staff Portal opens with password-only login (StaffPasswordLoginPage)
- App.tsx has view states: home, staff-password-login, staff-portal, admin-login, admin-dashboard
- HomePage shows 2 buttons: Staff Portal and Admin Login
- Backend has: getAllStaff, getAttendanceByDate, getTodayAttendance, getEarningsByStaffAndMonth, but no getAllAttendanceRecords
- Staff add is failing (Server temporarily unavailable)
- No "Staff Attendance" tab exists anywhere

## Requested Changes (Diff)

### Add
- New top-level navigation with 3 tabs on the main homepage: "Staff Portal", "Staff Attendance", "Admin Login"
- New `StaffAttendanceTab` component: shows all staff attendance data, daily (today) and monthly (current month) views, with check-in/check-out times for each staff per day
- New backend query function `getAllAttendanceRecords()` returning all AttendanceRecord entries (no auth needed, public data)
- backend.d.ts updated to include `getAllAttendanceRecords(): Promise<Array<AttendanceRecord>>`

### Modify
- HomePage: instead of two separate cards (Staff Portal, Admin Login), show a 3-tab navigation interface at the top. The main area changes based on selected tab.
  - Tab 1: "Staff Portal" → password login form (existing StaffPasswordLoginPage flow)
  - Tab 2: "Staff Attendance" → new attendance summary view
  - Tab 3: "Admin Login" → existing admin login
- App.tsx: add new view state "staff-attendance" if needed, or integrate tabs within HomePage component
- Backend main.mo: add `getAllAttendanceRecords` public query function

### Remove
- Nothing removed, no old data deleted

## Implementation Plan

1. Add `getAllAttendanceRecords()` to backend main.mo
2. Update backend.d.ts with new function signature
3. Refactor HomePage to show 3-tab layout (Staff Portal | Staff Attendance | Admin Login)
4. Create StaffAttendanceTab component:
   - Daily view: today's check-in/check-out for all staff (shows absent if no record)
   - Monthly view: month selector, then list all days with each staff's check-in/check-out
   - Each staff shows: name, photo, check-in time, check-out time, status (Present/Absent/Checked In)
5. Staff Portal tab shows the existing StaffPasswordLoginPage inline or navigates to it
6. Admin Login tab shows existing AdminLoginPage inline or navigates to it
7. Keep all existing data, no deletions
8. Staff add fix: ensure backend is redeployed fresh to restore connectivity
