import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password cannot exceed 64 characters")
  .regex(/[a-z]/, "Password must include lowercase")
  .regex(/[A-Z]/, "Password must include uppercase")
  .regex(/[0-9]/, "Password must include a number");

export const userCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: passwordRule,
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus).optional().default(UserStatus.ACTIVE)
});

export const userUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80).optional(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    password: passwordRule.optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  });
