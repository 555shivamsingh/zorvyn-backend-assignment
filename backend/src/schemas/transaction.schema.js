import { RecordType } from "@prisma/client";
import { z } from "zod";

export const transactionCreateSchema = z.object({
  amount: z.coerce.number().finite().positive(),
  type: z.nativeEnum(RecordType),
  category: z.string().trim().min(2).max(40),
  occurredAt: z.coerce.date(),
  notes: z.string().trim().max(300).optional().nullable()
});

export const transactionUpdateSchema = z
  .object({
    amount: z.coerce.number().finite().positive().optional(),
    type: z.nativeEnum(RecordType).optional(),
    category: z.string().trim().min(2).max(40).optional(),
    occurredAt: z.coerce.date().optional(),
    notes: z.string().trim().max(300).optional().nullable()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });

export const transactionQuerySchema = z.object({
  type: z.nativeEnum(RecordType).optional(),
  category: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20)
});
