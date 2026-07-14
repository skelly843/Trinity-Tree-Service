import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const customerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  serviceAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  preferredContactMethod: z.string().optional(),
  accountStatus: z.enum(['active', 'disabled']).default('active'),
  generalNotes: z.string().optional(),
});

export const employeeAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['global_admin', 'admin', 'customer']),
  accountStatus: z.enum(['active', 'disabled']).default('active'),
});

export const appointmentSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  assignedAdminId: z.string().uuid('Invalid assigned admin ID').optional().nullable(),
  title: z.string().min(2, 'Title is required'),
  serviceAddress: z.string().optional(),
  status: z.enum(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show']),
  startTime: z.string().min(1, 'Start date and time is required'),
  endTime: z.string().min(1, 'End date and time is required'),
  appointmentNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  customerVisibleNotes: z.string().optional(),
});

export const workRecordSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  appointmentId: z.string().uuid().optional().nullable(),
  assignedEmployeeId: z.string().uuid().optional().nullable(),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['Scheduled', 'In Progress', 'Completed', 'Cancelled']),
  dateStarted: z.string().optional().nullable(),
  dateCompleted: z.string().optional().nullable(),
  internalNotes: z.string().optional(),
  customerVisibleSummary: z.string().optional(),
});

export const customerNoteSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  appointmentId: z.string().uuid().optional().nullable(),
  workRecordId: z.string().uuid().optional().nullable(),
  content: z.string().min(1, 'Note content cannot be empty'),
  visibility: z.enum(['internal', 'customer']),
});

export const financialRecordSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  appointmentId: z.string().uuid().optional().nullable(),
  workRecordId: z.string().uuid().optional().nullable(),
  recordType: z.enum(['Estimate', 'Invoice', 'Charge', 'Payment', 'Credit', 'Refund', 'Expense', 'Other']),
  description: z.string().min(2, 'Description is required'),
  amountInCents: z.number().int().positive('Amount must be a positive integer in cents'),
  dueDate: z.string().optional().nullable(),
  paymentStatus: z.enum(['Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', 'Refunded']),
  paymentMethod: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  internalMemo: z.string().optional().nullable(),
  customerVisibleDescription: z.string().optional().nullable(),
  customerVisible: z.boolean().default(false),
});

export const documentSchema = z.object({
  customerId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  workRecordId: z.string().uuid().optional().nullable(),
  documentType: z.string().min(1),
  originalFilename: z.string().min(1),
  storagePath: z.string().min(1),
  mimeType: z.string().optional(),
  fileSize: z.number().int().optional(),
  description: z.string().optional(),
  customerVisible: z.boolean().default(false),
});

export const contentBlockSchema = z.object({
  pageId: z.string().uuid(),
  blockType: z.string(),
  sortOrder: z.number().int(),
  heading: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  imagePath: z.string().optional().nullable(),
  imageAltText: z.string().optional().nullable(),
  buttonLabel: z.string().optional().nullable(),
  buttonUrl: z.string().optional().nullable(),
  alignment: z.enum(['left', 'center', 'right']).default('left'),
  publishedStatus: z.boolean().default(true),
});
