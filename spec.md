# Fancy Looks Salon

## Current State
Existing app has a Staff Portal where all staff are listed and any staff profile can be viewed without any authentication. Admin Dashboard has full password protection. Backend has admin-only password for all admin operations. No staff-level password system exists.

## Requested Changes (Diff)

### Add
- Backend: `stable var staffPasswords` map (Nat -> Text) to store per-staff passwords
- Backend: `setStaffPassword(adminPassword, staffId, newPassword)` - Admin only, sets/resets a staff member's portal password
- Backend: `verifyStaffPassword(staffId, password)` - returns Bool, verifies if given password matches staff's stored password
- Backend: `hasStaffPassword(staffId)` - returns Bool, checks if a staff has a password set
- Frontend: Staff Portal now shows all staff list first; clicking a staff card prompts for password before showing their profile
- Frontend: Password modal/overlay appears when a staff card is clicked - user enters password, on success shows the full profile view
- Frontend: If staff has no password set, show a message "Password not set. Contact Admin."
- Frontend: Admin Dashboard > Staff Management tab gets a "Set Password" button per staff card to allow admin to set/reset that staff's portal password

### Modify
- Staff Portal flow: previously showed profile directly, now requires password verification per staff
- StaffManagementTab: add Set Password button and modal per staff
- No existing attendance, earnings, or analytics data is deleted or affected

### Remove
- Nothing removed

## Implementation Plan
1. Add `stable var staffPasswords = Map.empty<Nat, Text>()` to backend
2. Add `setStaffPassword`, `verifyStaffPassword`, `hasStaffPassword` public functions to backend
3. Update `backend.d.ts` with new function signatures
4. Update StaffPortalPage/StaffSelectionPage: when a staff card is clicked, show password entry modal; on correct password show profile; on wrong password show error
5. Update StaffManagementTab in Admin Dashboard: add "Set Password" / "Reset Password" button per staff, opens modal to enter new password, calls setStaffPassword
6. All changes are purely additive - no data deletion
