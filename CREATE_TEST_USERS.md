# Creating Test Users - Step by Step

It looks like the test users haven't been created yet. Here are two ways to create them:

## Method 1: Use the Seed Page (Easiest)

1. **Navigate to the seed page**: Go to `http://localhost:5173/seed-users` (or your app URL + /seed-users)
2. **Click the button**: Click "Generate Test Users"
3. **Wait for completion**: Watch the progress log - it will take 2-3 minutes
4. **Verify success**: You should see a green success message when done
5. **Try logging in**: Go to `/login` and use:
   - Email: sarah@test.com
   - Password: test123

## Method 2: Manual Signup (If Seed Page Doesn't Work)

If the seed page isn't working, you can manually create the accounts:

### Step 1: Sign Up Sarah
1. Go to `/signup`
2. Enter:
   - Name: Sarah Chen
   - Email: sarah@test.com
   - Password: test123
3. Click "Create Account"
4. You should be logged in automatically

### Step 2: Sign Up Other Users (Optional)
Repeat the same process for:
- Mike: mike@test.com / test123
- Emma: emma@test.com / test123
- James: james@test.com / test123
- Lisa: lisa@test.com / test123

## Troubleshooting

### Issue: "Invalid credentials" when logging in
**Cause**: The user hasn't been created yet
**Solution**: Follow Method 1 or Method 2 above to create the user first

### Issue: Seed page shows errors
**Possible causes**:
1. Supabase connection issue - check your .env file
2. Database migrations not run
3. RLS policies blocking creation

**To check**:
```bash
# Verify Supabase connection
cat .env | grep VITE_SUPABASE
```

### Issue: Can sign up but can't log in
**Cause**: Email confirmation might be enabled in Supabase
**Solution**:
1. Go to your Supabase dashboard
2. Navigate to Authentication → Settings
3. Disable "Email confirmation"

## Current Status Check

Let me verify if the users exist:
- Navigate to your Supabase dashboard
- Go to Authentication → Users
- Check if any users are listed

If no users are listed, that confirms they need to be created using one of the methods above.

## Quick Test

The fastest way to test if everything is working:

1. Go to `/signup`
2. Create ONE test account:
   - Name: Test User
   - Email: test@test.com
   - Password: test123
3. Try logging in with those credentials
4. If this works, the system is functioning correctly

Then you can either:
- Use the seed page to create the 5 full test users
- Or manually sign up the users you want to test with

---

**Important**: The credentials (sarah@test.com / test123) will only work AFTER you've created those users using one of the methods above. They don't exist by default - they need to be created first!
