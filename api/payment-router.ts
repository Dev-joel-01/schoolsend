import { z } from "zod";
import { eq, and, sum, count, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments, students, streams } from "@db/schema";

export const paymentRouter = createRouter({
  // List payments by school with filters
  list: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        type: z.enum(["fees", "pocket_money"]).optional(),
        status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
        studentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(payments.schoolId, input.schoolId)];
      if (input.type) conditions.push(eq(payments.type, input.type));
      if (input.status) conditions.push(eq(payments.status, input.status));
      if (input.studentId)
        conditions.push(eq(payments.studentId, input.studentId));

      return db
        .select({
          payment: payments,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          admissionNumber: students.admissionNumber,
        })
        .from(payments)
        .leftJoin(students, eq(payments.studentId, students.id))
        .where(and(...conditions))
        .orderBy(desc(payments.createdAt));
    }),

  // Get fees by stream (for chart)
  getFeesByStream: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          streamId: students.streamId,
          streamName: streams.name,
          streamGrade: streams.grade,
          totalFees: sql<string>`SUM(${students.feeBalance})`,
          studentCount: sql<number>`COUNT(*)`,
          avgFeeBalance: sql<string>`AVG(${students.feeBalance})`,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .where(eq(students.schoolId, input.schoolId))
        .groupBy(students.streamId, streams.name, streams.grade)
        .orderBy(streams.grade, streams.name);
    }),

  // Get pocket money by stream (for chart)
  getPocketMoneyByStream: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          streamId: students.streamId,
          streamName: streams.name,
          streamGrade: streams.grade,
          totalPocketMoney: sql<string>`SUM(${students.pocketMoneyBalance})`,
          studentCount: sql<number>`COUNT(*)`,
          avgPocketMoney: sql<string>`AVG(${students.pocketMoneyBalance})`,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .where(eq(students.schoolId, input.schoolId))
        .groupBy(students.streamId, streams.name, streams.grade)
        .orderBy(streams.grade, streams.name);
    }),

  // Get payment summary
  getSummary: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const schoolId = input.schoolId;

      // Total completed payments
      const [totalPayments] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.schoolId, schoolId),
            eq(payments.status, "completed")
          )
        );

      // Fees payments
      const [feesPayments] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.schoolId, schoolId),
            eq(payments.type, "fees"),
            eq(payments.status, "completed")
          )
        );

      // Pocket money payments
      const [pocketPayments] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.schoolId, schoolId),
            eq(payments.type, "pocket_money"),
            eq(payments.status, "completed")
          )
        );

      // Payment count
      const [paymentCount] = await db
        .select({ count: count() })
        .from(payments)
        .where(eq(payments.schoolId, schoolId));

      return {
        totalPayments: totalPayments?.total || "0",
        feesPayments: feesPayments?.total || "0",
        pocketPayments: pocketPayments?.total || "0",
        paymentCount: paymentCount?.count || 0,
      };
    }),

  // Record a new payment (from M-Pesa callback)
  create: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        studentId: z.number(),
        type: z.enum(["fees", "pocket_money"]),
        amount: z.string(),
        phoneNumber: z.string(),
        mpesaReceipt: z.string().optional(),
        status: z.enum(["pending", "completed", "failed"]).default("completed"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Insert payment record
      const [payment] = await db.insert(payments).values({
        schoolId: input.schoolId,
        studentId: input.studentId,
        type: input.type,
        amount: input.amount,
        phoneNumber: input.phoneNumber,
        mpesaReceipt: input.mpesaReceipt || null,
        status: input.status,
      });

      // Update student balance
      if (input.status === "completed") {
        const [student] = await db
          .select()
          .from(students)
          .where(eq(students.id, input.studentId));

        if (student) {
          const currentBalance =
            input.type === "fees"
              ? parseFloat(student.feeBalance)
              : parseFloat(student.pocketMoneyBalance);
          const newBalance = (
            currentBalance - parseFloat(input.amount)
          ).toFixed(2);

          if (input.type === "fees") {
            await db
              .update(students)
              .set({ feeBalance: newBalance })
              .where(eq(students.id, input.studentId));
          } else {
            await db
              .update(students)
              .set({ pocketMoneyBalance: newBalance })
              .where(eq(students.id, input.studentId));
          }
        }
      }

      return { success: true, payment };
    }),
});
