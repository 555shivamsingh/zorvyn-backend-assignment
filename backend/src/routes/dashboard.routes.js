import { RecordType } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/responses.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", requireAuth(["ADMIN", "ANALYST", "VIEWER"]), async (req, res) => {
  const [typeTotals, categoryTotals, recentActivity] = await Promise.all([
    prisma.financialRecord.groupBy({
      by: ["type"],
      where: { isDeleted: false },
      _sum: { amount: true }
    }),
    prisma.financialRecord.groupBy({
      by: ["category"],
      where: { isDeleted: false },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 6
    }),
    prisma.financialRecord.findMany({
      where: { isDeleted: false },
      orderBy: { occurredAt: "desc" },
      take: 8
    })
  ]);

  const income = Number(
    typeTotals.find((entry) => entry.type === RecordType.INCOME)?._sum.amount || 0
  );
  const expense = Number(
    typeTotals.find((entry) => entry.type === RecordType.EXPENSE)?._sum.amount || 0
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendRaw = await prisma.financialRecord.groupBy({
    by: ["occurredAt", "type"],
    where: {
      isDeleted: false,
      occurredAt: { gte: thirtyDaysAgo }
    },
    _sum: { amount: true },
    orderBy: { occurredAt: "asc" }
  });

  const trendMap = new Map();
  for (const item of trendRaw) {
    const day = item.occurredAt.toISOString().slice(0, 10);
    const current = trendMap.get(day) || { income: 0, expense: 0 };
    if (item.type === RecordType.INCOME) {
      current.income += Number(item._sum.amount || 0);
    } else {
      current.expense += Number(item._sum.amount || 0);
    }
    trendMap.set(day, current);
  }

  const monthlyTrend = Array.from(trendMap.entries()).map(([day, value]) => ({
    day,
    ...value
  }));

  return ok(res, {
    totals: {
      income,
      expense,
      net: income - expense
    },
    categoryTotals: categoryTotals.map((item) => ({
      category: item.category,
      total: Number(item._sum.amount || 0)
    })),
    recentActivity,
    monthlyTrend
  });
});
