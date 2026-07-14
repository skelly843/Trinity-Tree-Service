# Trinity Tree Supabase Setup Guide

This directory contains the database structure, triggers, permissions, Row Level Security (RLS) policies, and optional seed data required to host the **Trinity Tree** customer and website management portal.

## How to Set Up Supabase

### 1. Create a Supabase Project
- Log in to your [Supabase Dashboard](https://supabase.com).
- Click **New Project** and select your organization.
- Enter `Trinity Tree` as the Name, specify a secure database password, and choose your region.

### 2. Run the Complete Setup Script
- Navigate to the **SQL Editor** tab in the sidebar of your Supabase dashboard.
- Create a new query.
- Copy the entire contents of `supabase/trinity_tree_complete_setup.sql` and paste them into the SQL Editor.
- Click **Run** to set up extensions, custom enums, tables, relationships, auto-updating triggers, and RLS policies.

### 3. Setup Storage Buckets
Ensure the following storage buckets are created in your Supabase project (under the **Storage** section in the sidebar):

1. **public-gallery**:
   - Status: Public
   - Description: Used for public gallery photos.
2. **website-content**:
   - Status: Public
   - Description: Public assets used in homepage or about page.
3. **customer-documents**:
   - Status: Private
   - Description: Receipts, invoices, and service contracts.
4. **customer-work-photos**:
   - Status: Private or public (controlled via RLS).

Configure policies in the storage bucket manager:
- Allow `global_admin` role users read, write, and delete permissions on all buckets.
- Allow public read permissions on `public-gallery` and `website-content`.
- Only allow authenticated owners/assigned admins to read and write private paths in `customer-documents` and `customer-work-photos`.

### 4. Setup Authentication URLs
- Go to **Authentication** > **URL Configuration**.
- Set your **Site URL** to `http://localhost:3000` (or your production URL).
- Add redirect wildcards like `http://localhost:3000/**` to ensure callbacks work perfectly.

### 5. Create the First Global Admin
- Navigate to the **Authentication** > **Users** section in the Supabase dashboard.
- Click **Add User** > **Create User**. Enter a valid email and strong password.
- Go to the **SQL Editor** and run the following command to promote that user to `global_admin`:
  ```sql
  update public.profiles
  set role = 'global_admin'
  where email = 'your-admin-email@example.com';
  ```

---

## Testing Each Role and RLS Verification

You can verify that Row Level Security restricts users perfectly by executing standard API queries inside the Supabase Console using user JWTs or via the integrated Jest/Vitest suite.

1. **Global Admin**: View, update, and manage all tables, create employees/admins, view financial records, and edit website blocks.
2. **Normal Admin**: Read/edit only assigned customers and their corresponding appointments, work records, and notes. Normal admins should see `0` or throw a permission error on direct `financial_records` fetches.
3. **Customer**: Can only view their own user profile, linked customer record, own appointments, customer-visible notes, and marked customer-visible financials.
4. **Disabled User**: Denied access to any resource.
