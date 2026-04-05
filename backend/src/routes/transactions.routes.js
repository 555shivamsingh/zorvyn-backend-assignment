import { Prisma } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { prisma } from "../lib/prisma.js";
import { fail, ok } from "../lib/responses.js";
import {
  transactionCreateSchema,
  transactionQuerySchema,
  transactionUpdateSchema
} from "../schemas/transaction.schema.js";

export const transactionsRouter = Router();

transactionsRouter.get(
  "/",
  requireAuth(["ADMIN", "ANALYST", "VIEWER"]),
  validateQuery(transactionQuerySchema),
  async (req, res) => {
    const { type, category, from, to, page, pageSize } = req.validatedQuery;

    const where = {
      isDeleted: false,
      ...(type ? { type } : {}),
      ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
      ...(from || to
        ? {
            occurredAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {})
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.financialRecord.count({ where })
    ]);

    return ok(res, {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  }
);

transactionsRouter.post("/", requireAuth(["ADMIN"]), validateBody(transactionCreateSchema), async (req, res) => {
  const data = req.validatedBody;

  const record = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(data.amount.toFixed(2)),
      type: data.type,
      category: data.category,
      occurredAt: data.occurredAt,
      notes: data.notes,
      createdById: req.user.id
    }
  });

  return ok(res, { record }, 201);
});

transactionsRouter.patch(
  "/:id",
  requireAuth(["ADMIN"]),
  validateBody(transactionUpdateSchema),
  async (req, res) => {
    const id = req.params.id;
    const data = req.validatedBody;

    const existing = await prisma.financialRecord.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return fail(res, "Transaction not found", 404);
    }

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        amount: data.amount ? new Prisma.Decimal(data.amount.toFixed(2)) : undefined,
        type: data.type,
        category: data.category,
        occurredAt: data.occurredAt,
        notes: data.notes,
        updatedById: req.user.id
      }
    });

    return ok(res, { record });
  }
);

transactionsRouter.delete("/:id", requireAuth(["ADMIN"]), async (req, res) => {
  const id = req.params.id;

  const existing = await prisma.financialRecord.findFirst({ where: { id, isDeleted: false } });
  if (!existing) {
    return fail(res, "Transaction not found", 404);
  }

  await prisma.financialRecord.update({
    where: { id },
    data: {
      isDeleted: true,
      updatedById: req.user.id
    }
  });

  return ok(res, { success: true });
});
