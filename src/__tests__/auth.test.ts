import { z } from 'zod';
import { loginSchema, customerSchema } from '../utils/validation';

describe('Role Authorization and Input Validation Tests', () => {
  it('should block invalid email or short password in Login Validation Schema', () => {
    const invalidEmailResult = loginSchema.safeParse({ email: 'bademail', password: '123' });
    expect(invalidEmailResult.success).toBe(false);

    const validResult = loginSchema.safeParse({ email: 'valid@example.com', password: 'secretpassword123' });
    expect(validResult.success).toBe(true);
  });

  it('should validate Customer Account input constraints correctly', () => {
    const invalidCustomer = customerSchema.safeParse({
      fullName: 'J', // too short
      email: 'not-an-email',
    });
    expect(invalidCustomer.success).toBe(false);

    const validCustomer = customerSchema.safeParse({
      fullName: 'Arborist Jane',
      email: 'arborist.jane@example.com',
      phone: '(555) 012-3456',
      accountStatus: 'active',
    });
    expect(validCustomer.success).toBe(true);
  });
});
