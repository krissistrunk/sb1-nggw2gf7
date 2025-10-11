# Quick Start - Creating Test Users

## Important: Users Need to Be Created First!

The test credentials **DO NOT exist yet**. You need to create them using one of the methods below.

---

## Fastest Method: Automated Seed Page (2 minutes)

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to:
   ```
   http://localhost:5173/seed-users
   ```

3. **Click the button**: "Generate Test Users"

4. **Wait 2-3 minutes** - You'll see progress messages like:
   - Creating user: Sarah Chen
   - Creating user: Mike Rodriguez
   - etc.

5. **Once complete**, go to `/login` and use:
   - Email: **sarah@test.com**
   - Password: **test123**

---

## Alternative: Manual Signup (30 seconds per user)

If the seed page doesn't work:

1. Go to: `http://localhost:5173/signup`

2. Fill in the form:
   - **Name**: Sarah Chen
   - **Email**: sarah@test.com
   - **Password**: test123

3. Click "Create Account"

4. You'll be logged in automatically and redirected to `/today`

5. You can now log out and create other users, or just use Sarah's account

---

## Why Doesn't sarah@test.com Work?

Because **no users exist in the database yet**!

Think of it like this:
- The credentials I provided are the **suggested credentials** to use
- You still need to **create the account** using those credentials
- After creating the account, THEN you can log in with those credentials

---

## Verify Users Were Created

After using the seed page or manual signup, you can verify by:

1. Going to your Supabase dashboard
2. Navigating to: Authentication → Users
3. You should see the email addresses listed there

---

## What Happens After Signup?

- **With manual signup**: You'll have an empty account with no data
- **With seed page**: You'll have 2 years of sample data automatically created

---

## Next Steps After Creating Users

Once you've created Sarah's account (or any test user):

1. **Log in** with: sarah@test.com / test123
2. **Explore** the empty dashboard
3. **Create some data**:
   - Add an area (like "Career" or "Health")
   - Create an outcome within that area
   - Add some actions
4. **Or** go back to `/seed-users` to generate 2 years of sample data

---

## Common Issues

### "Invalid login credentials"
- You haven't created the user yet
- Use `/signup` or `/seed-users` first

### Seed page shows errors
- Check browser console (F12)
- Verify Supabase connection in `.env` file
- Make sure migrations have run

### After signup, I see "Route not found"
- This has been fixed - you should now go to `/today`
- If you still see this, try logging in again

---

## Summary

1. **First time?** Go to `/seed-users` OR `/signup`
2. **Already created users?** Go to `/login` and use the credentials
3. **Not working?** Check the troubleshooting section above

The key point: **You must CREATE the users before you can LOG IN as them!**
