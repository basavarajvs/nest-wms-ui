# Prompt 18 — My Profile & Security Settings

## Task

Build the user's own Profile page and Security settings (change password, MFA, PIN management, preferences).

## API Hooks Used

### Profile

From `@/lib/api/wms-saas-core-api/users/users`:
- `useUserControllerGetMe` (GET /users/me) — current user
- `useUserControllerUpdateMe` (PATCH /users/me) — update profile
- `useUserControllerUpdateMyPreferences` (PATCH /users/me/preferences) — update preferences
- `useUserControllerSetupMyPin` (POST /users/me/pin/setup) — setup PIN
- `useUserControllerChangeMyPin` (POST /users/me/pin/change) — change PIN

Types: `UpdateUserDto`, `UpdateUserDtoAddress`, `UpdateUserPreferencesDto`, `SetupPinDto`, `ChangePinDto`

### Security (Auth)

From `@/lib/api/wms-saas-core-api/auth/auth`:
- `useAuthControllerChangePassword` (POST /auth/change-password)
- `useAuthControllerEnableMfa` (POST /auth/mfa/enable) — generates secret + QR
- `useAuthControllerVerifyMfa` (POST /auth/mfa/verify) — verify + enable
- `useAuthControllerDisableMfa` (POST /auth/mfa/disable)
- `useAuthControllerLogoutAll` (POST /auth/logout-all) — logout all sessions

Types: `ChangePasswordDto`, `VerifyMfaDto`

## Files to Create

### 1. `src/pages/profile/profile.tsx`

Profile page:
- Avatar section: show current avatar (initials fallback), upload option (if backend supports file upload)
- Personal Information card:
  - First Name (editable)
  - Last Name (editable)
  - Email (read-only)
  - Phone (editable)
  - Timezone (editable select)
  - Locale (editable select)
- Address card (if address fields exist):
  - Street, City, State, ZIP, Country
- "Save Changes" button
- Changes show toast on success

### 2. `src/pages/profile/preferences.tsx`

Preferences section (can be tab within profile):
- Theme preference (system/light/dark) — note: app-level theme is already in shadcn-admin
- Notification preferences:
  - Email notifications toggle
  - In-app notifications toggle
  - Digest frequency (daily, weekly, never)
- Language/Locale
- Timezone

### 3. `src/pages/security/security-settings.tsx`

Security settings page (at `/security-settings` or via `/profile/security`):

**Password Section:**
- Current Password input
- New Password input with strength indicator
- Confirm New Password input
- "Change Password" button
- Validation: new password must differ from current

**MFA/2FA Section:**
- Current MFA status (Enabled/Disabled badge)
- If disabled:
  - "Enable MFA" button
  - Opens MFA setup dialog:
    - QR Code (generated from enableMfa response)
    - Setup key (text, copyable)
    - 6-digit code input to verify
    - "Verify & Enable" button
- If enabled:
  - "Disable MFA" button with confirmation
  - "Re-generate Setup" button (if available)

**PIN Section:**
- If PIN not set: "Set Up PIN" button
- If PIN set: "Change PIN" form
  - Current PIN
  - New PIN (4-6 digits)
  - Confirm new PIN

**Sessions Section:**
- "Logout All Sessions" button with confirmation
- Shows: "This will log you out from all devices except this one."
- On confirm: calls `useAuthControllerLogoutAll`, redirect to login

### 4. `src/pages/security/mfa-setup-dialog.tsx`

MFA setup dialog:
- Step 1: "Scan this QR code with your authenticator app"
  - Display QR code image (from enableMfa response)
  - Display secret key copyable
- Step 2: "Enter the 6-digit code from your app"
  - 6-digit input
  - "Verify" button
- On success: "MFA enabled" toast, update status
- On failure: error toast, retry

### 5. `src/hooks/profile.ts`

Custom hooks for profile data.

## UI/UX Requirements

- Profile uses Card layout with form sections
- Avatar: use shadcn `Avatar` component with fallback initials
- QR Code: display as image (data URL from API response)
- MFA setup: two-step wizard within dialog
- Password strength indicator: progress bar (weak/medium/strong)
- PIN input: use `Input` with `type="password"` pattern
- All actions show success/error toasts
- Confirmations for destructive actions (disable MFA, logout all)
- Loading state while saving
- Session management: show last active sessions if API provides them

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/profile` loads with user info
2. Edit name, save → toast success
3. Update preferences, save
4. Change password:
   - Wrong current password → error
   - Valid change → success toast
5. Enable MFA:
   - Dialog shows QR code
   - Enter valid code → MFA enabled
6. Disable MFA → confirmation → disabled
7. Set up PIN
8. Change PIN
9. Logout all sessions → redirected to login
