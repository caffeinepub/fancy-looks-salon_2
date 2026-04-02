# Fancy Looks Salon

## Current State
Staff Portal currently shows a list of all staff cards. When a staff card is clicked, it goes to a dedicated login page (StaffLoginPage) where the staff must enter their password. If 'Remember Me' was checked, the staff is auto-logged in by ID stored in localStorage.

## Requested Changes (Diff)

### Add
- A new `StaffPasswordLoginPage` component that shows ONLY a password input box (no staff list, no staff cards visible)
- Backend support for a new query: `findStaffByPassword(password: Text) -> async ?Nat` -- returns staffId if password matches any staff, else null
- The new flow: Staff Portal opens → password box shown → staff types password → if valid, that staff's profile opens automatically

### Modify
- `App.tsx`: Change Staff Portal entry view from `staff-selection` to a new `staff-password-login` view
- The `staff-selection` view/component is no longer the entry point for Staff Portal
- After successful password login, go directly to `staff-portal` for that staff
- 'Remember Me' logic: if remembered staff ID exists in localStorage, skip password entry and go directly to that staff's portal
- `StaffSelectionPage` is no longer shown on Staff Portal entry (it can remain for Admin or be removed)

### Remove
- Staff Portal entry no longer shows the staff list/selection grid

## Implementation Plan
1. Add `findStaffByPassword` query function to `src/backend/main.mo` -- iterates over staffPasswords map and returns the staffId whose password matches
2. Update `src/frontend/src/declarations/backend.did.js` and `backend.did.d.ts` to include `findStaffByPassword`
3. Update `src/frontend/src/backend.d.ts` to include `findStaffByPassword` in backendInterface
4. Create `src/frontend/src/components/StaffPasswordLoginPage.tsx` -- shows salon branding, a single password input, submit button, error handling, and 'Remember Me' checkbox
5. Update `src/frontend/src/App.tsx`:
   - Add new view state `staff-password-login`
   - On 'Staff Portal' button click from HomePage, go to `staff-password-login`
   - On successful password match, set selectedStaff and go to `staff-portal`
   - Check localStorage for remembered staff on entry; if found, skip to portal directly
