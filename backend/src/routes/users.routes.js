import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../lib/prisma.js";
import { fail, ok } from "../lib/responses.js";
import { hashPassword } from "../lib/security.js";
import { userCreateSchema, userUpdateSchema } from "../schemas/user.schema.js";

export const usersRouter = Router();

usersRouter.get("/", requireAuth(["ADMIN"]), async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return ok(res, { users });
});

usersRouter.post("/", requireAuth(["ADMIN"]), validateBody(userCreateSchema), async (req, res) => {
  const data = req.validatedBody;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail(res, "Email already exists", 409);
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      status: data.status
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return ok(res, { user }, 201);
});

usersRouter.patch("/:id", requireAuth(["ADMIN"]), validateBody(userUpdateSchema), async (req, res) => {
  const id = req.params.id;
  const data = req.validatedBody;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return fail(res, "User not found", 404);
  }

  if (req.user.id === id && data.status === "INACTIVE") {
    return fail(res, "You cannot deactivate your own account", 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      fullName: data.fullName,
      role: data.role,
      status: data.status,
      passwordHash: data.password ? await hashPassword(data.password) : undefined
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return ok(res, { user });
});
