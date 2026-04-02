# Fancy Looks Salon

## Current State
Staff Attendance tab exists and shows daily/monthly views. However:
- On mobile, check-in/check-out times are hidden (`hidden sm:flex`)
- Monthly view rows show extra badges (Late, OT) that clutter the view
- The focus should be ONLY on check-in time and check-out time per staff per day
- All other features (Admin Dashboard, Staff Portal, analytics, staff management) must remain fully functional

## Requested Changes (Diff)

### Add
- Check-in and check-out times always visible on all screen sizes (mobile + desktop)
- In daily view: each staff row clearly shows Name, Check-In Time, Check-Out Time
- In monthly view: each day-date block shows each staff's Name, Check-In Time, Check-Out Time

### Modify
- Remove Late/OT/Early Exit badges from StaffAttendanceTab (keep them in Admin Analytics only)
- Make time columns always visible (remove `hidden sm:` classes on time display)
- Simplify the row layout for clarity: Name | Check-In | Check-Out | Status

### Remove
- Late badge and OT badge from StaffAttendanceTab rows (not from Admin Analytics)

## Implementation Plan
1. Edit `StaffAttendanceTab.tsx`:
   - Remove `hidden sm:flex` from time display divs — always show times
   - Remove the Late and OT badges from both DailyView and MonthlyView rows
   - Make layout cleaner: photo + name on left, check-in time + check-out time on right, status badge
   - Ensure mobile layout is clean and readable
   - No backend changes needed
   - No other files touched
