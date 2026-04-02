# Fancy Looks Salon

## Current State
Admin Dashboard Live Status tab has check-in/check-out time edit functionality (✏️ icon), but:
- The edit panel only allows editing the time (HH:MM), not the date — backend uses `Time.now()` to compute the day start, so editing only works for today
- After a staff member checks out, the Check-In button remains disabled (no re-check-in possible)
- Staff Attendance monthly view shows wrong dates due to UTC/IST offset in `epochDaysToDate` helper

## Requested Changes (Diff)

### Add
- Date input field in the Live Status edit panel (alongside time input) so admin can edit attendance records for any date, not just today
- Re-check-in logic: after checkout, allow staff to check in again after a 2-minute cooldown
- Backend `updateCheckInTime` and `updateCheckOutTime` must compute the day start from the passed `date` string (epoch-days), not from `Time.now()`

### Modify
- `LiveStatusTab.tsx`: EditPanel gets a date field; mutations pass the selected date to backend
- `StaffPortalPage.tsx`: Check-In button enabled again after 2 minutes post check-out; UI shows countdown if within the 2-min window
- `StaffAttendanceTab.tsx`: Fix `epochDaysToDate` to use UTC noon to avoid timezone offset shifting day display
- `main.mo`: `updateCheckInTime` and `updateCheckOutTime` — compute `dayStartNs` from the passed `date` text (epoch-days) rather than `Time.now()`

### Remove
- Nothing deleted

## Implementation Plan
1. Fix `main.mo` backend: in `updateCheckInTime` and `updateCheckOutTime`, parse `date` (epoch-days string) into `dayStartNs = Nat.fromText(date) * 24 * 60 * 60 * 1_000_000_000` instead of `Time.now()`
2. Fix `StaffAttendanceTab.tsx`: `epochDaysToDate` use UTC noon (add 12 * 3600 * 1000) to avoid day shift in IST
3. Update `LiveStatusTab.tsx`: add date input to EditPanel; default to today; mutations use the selected date instead of `attendance.date`
4. Update `StaffPortalPage.tsx`: after checkout, track checkout time; enable Check-In button after 2 minutes with a countdown timer
