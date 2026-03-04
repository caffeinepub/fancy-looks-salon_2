# Fancy Looks Salon

## Current State
Full-stack salon management app with:
- Staff portal (check-in/check-out, earnings entry)
- Admin Dashboard (Live Status, Analytics, Monthly Summary, Staff Management, Notifications)
- Password-based admin login (password: "Fancy0308") with frontend fallback
- Backend authorization uses AccessControl with #admin/#user permissions
- `addStaff`, `updateStaff`, `removeStaff` require `#admin` permission
- `getAllStaff`, `getStaffById`, attendance, earnings, notifications require `#user` permission
- Anonymous callers have no permissions — this causes "Service temporarily unavailable" / rejection errors when adding staff

## Requested Changes (Diff)

### Add
- Backend: `addStaff`, `updateStaff`, `removeStaff` should accept an `adminPassword: Text` parameter and verify it equals "Fancy0308" before proceeding (instead of AccessControl admin check)
- Backend: `getAllStaff`, `getStaffById`, `getTodayAttendance`, `getEarningsByStaffAndMonth`, `getRecentNotifications`, `checkIn`, `checkOut`, `addOrUpdateEarningsEntry` should be accessible to anonymous callers (remove #user permission check or make them public query/shared)
- Backend: `verifyAdminPassword` stays as a public query

### Modify
- Frontend StaffManagementTab: pass `adminPassword = "Fancy0308"` as argument to `addStaff`, `updateStaff`, `removeStaff` calls
- Remove `useAdminActor` hook usage from StaffManagementTab — just use regular `actor` from `useActor`

### Remove
- Backend permission checks on read-only and staff-portal endpoints (replace with open access)
- Backend permission checks on write staff endpoints (replace with password param check)

## Implementation Plan
1. Regenerate backend with new function signatures: addStaff/updateStaff/removeStaff take adminPassword param; all read + check-in/out functions are open (no permission check)
2. Update StaffManagementTab to pass "Fancy0308" as adminPassword argument and remove useAdminActor
3. Validate and build
