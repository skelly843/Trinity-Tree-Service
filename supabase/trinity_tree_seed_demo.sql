-- Optional seed demo data for Trinity Tree
-- Run this script to populate a test database with mock records.

-- We can insert mock customers (who don't have to have active auth profiles linked immediately)
insert into public.customers (id, full_name, email, phone, service_address, city, state, zip_code, preferred_contact_method, account_status, general_notes)
values
  ('11111111-1111-1111-1111-111111111111', 'John Doe', 'john.doe@example.com', '(555) 123-4567', '456 Elm Ave', 'Chicago', 'IL', '60611', 'email', 'active', 'Prefers call before arrival.'),
  ('22222222-2222-2222-2222-222222222222', 'Jane Smith', 'jane.smith@example.com', '(555) 987-6543', '789 Oak Blvd', 'Chicago', 'IL', '60612', 'phone', 'active', 'Watch out for the backyard dog.');

-- Add a default gallery item
insert into public.gallery_items (title, caption, alt_text, category, storage_path, display_order, published_status, is_cover)
values
  ('Huge Oak Trimming', 'Successfully pruned a 100-year-old oak tree without damage.', 'Worker trimming branches of a massive oak tree', 'Trimming', 'gallery/oak-trimming.jpg', 1, true, true),
  ('Emergency Storm Cleanup', 'Quick response to clear fallen pine tree blocking a driveway.', 'Fallen tree cleared from driveway', 'Emergency', 'gallery/pine-cleanup.jpg', 2, true, false);
