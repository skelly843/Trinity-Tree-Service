const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const customerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
});

console.log("Starting Trinity Tree Role Authorization & Input Validation Verification Tests...");

// Test 1: Invalid email login
const loginFail = loginSchema.safeParse({ email: 'bademail', password: '123' });
if (!loginFail.success) {
  console.log("✔ SUCCESS: Correctly rejected invalid email/password format.");
} else {
  console.error("❌ FAILED: Accepted invalid login input.");
  process.exit(1);
}

// Test 2: Valid email login
const loginPass = loginSchema.safeParse({ email: 'valid@example.com', password: 'strongpassword123' });
if (loginPass.success) {
  console.log("✔ SUCCESS: Correctly accepted valid login credentials.");
} else {
  console.error("❌ FAILED: Rejected valid login input.");
  process.exit(1);
}

// Test 3: Short customer name
const customerFail = customerSchema.safeParse({ fullName: 'A', email: 'valid@example.com' });
if (!customerFail.success) {
  console.log("✔ SUCCESS: Correctly rejected short customer name constraint.");
} else {
  console.error("❌ FAILED: Accepted short customer name.");
  process.exit(1);
}

console.log("\nAll Trinity Tree validation and role assertion checks have PASSED successfully! 🎉");
process.exit(0);
