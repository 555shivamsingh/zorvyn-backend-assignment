import { prisma } from "../lib/prisma.js";
import { fail } from "../lib/responses.js";
import { verifyToken } from "../lib/security.js";

export function requireAuth(roles = []) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(res, "Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded?.sub) {
      return fail(res, "Invalid or expired token", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true, status: true }
    });

    if (!user || user.status !== "ACTIVE") {
      return fail(res, "User is inactive or not found", 403);
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return fail(res, "Forbidden", 403);
    }

    req.user = user;
    return next();
  };
}
