import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { fail, ok } from "../lib/responses.js";
import { signToken, verifyPassword } from "../lib/security.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { validateBody } from "../middleware/validate.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.validatedBody;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail(res, "Invalid credentials", 401);
  }

  if (user.status !== "ACTIVE") {
    return fail(res, "User is inactive", 403);
  }

  const token = signToken({
    sub: user.id,
    role: user.role,
    status: user.status
  });

  return ok(res, {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});
