# Email/Password Login Debugging Report

## Issues Found & Fixed

### 1. Missing Soft-Delete Check — ✅ FIXED
Login controller now filters out soft-deleted users with `deleted_at: null`.

### 2. Missing Password Field Check — ✅ FIXED
Explicit check for missing password field (Google OAuth-only accounts).

### 3. Excessive Logging — ✅ FIXED
Removed sensitive debug logging from production code.

### 4. Password Not Hashed on Change — ✅ FIXED
`changePassword` now properly hashes with bcrypt before saving.

## Testing

After backend redeploys, verify:
1. Login works with email/password
2. Google OAuth login works
3. Password change works correctly
4. Soft-deleted users cannot login
