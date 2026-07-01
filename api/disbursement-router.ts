import { z } from "zod";
import { eq, and, sum, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { disbursements, students } from "@db/schema";

export const disbursementRouter = createRouter({
  // List disbursements by school
  list: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        studentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(disbursements.schoolId, input.schoolId)];
      if (input.studentId)
        conditions.push(eq(disbursements.studentId, input.studentId));

      return db
        .select({
          disbursement: disbursements,
          firstName: students.firstName,
          lastName: students.lastName,
          admissionNumber: students.admissionNumber,
          parentPhone: students.parentPhone,
          parentName: students.parentName,
        })
        .from(disbursements)
        .leftJoin(students, eq(disbursements.studentId, students.id))
        .where(and(...conditions))
        .orderBy(desc(disbursements.createdAt));
    }),

  // Create disbursement (give pocket money to student)
  create: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        studentId: z.number(),
        amount: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = ctx.user;
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }
      const disbursedBy = user.id;

      // Get student
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, input.studentId));

      if (!student) throw new Error("Student not found");

      const currentBalance = parseFloat(student.pocketMoneyBalance);
      const disburseAmount = parseFloat(input.amount);

      if (disburseAmount > currentBalance) {
        throw new Error(
          `Disbursement amount (${disburseAmount}) exceeds pocket money balance (${currentBalance})`
        );
      }

      // Create disbursement record
      const [disbursement] = await db.insert(disbursements).values({
        schoolId: input.schoolId,
        studentId: input.studentId,
        amount: input.amount,
        disbursedBy,
        notes: input.notes || null,
      });

      // Update student pocket money balance
      const newBalance = (currentBalance - disburseAmount).toFixed(2);
      await db
        .update(students)
        .set({ pocketMoneyBalance: newBalance })
        .where(eq(students.id, input.studentId));

      return { success: true, disbursement, newBalance };
    }),

  // Get disbursement summary
  getSummary: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const [totalDisbursed] = await db
        .select({ total: sum(disbursements.amount) })
        .from(disbursements)
        .where(eq(disbursements.schoolId, input.schoolId));

      const [disburseCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(disbursements)
        .where(eq(disbursements.schoolId, input.schoolId));

      return {
        totalDisbursed: totalDisbursed?.total || "0",
        disburseCount: disburseCount?.count || 0,
      };
    }),

  // Get pocket money per stream for disbursement
  getPocketMoneyPerStream: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { streams: streamsTable } = await import("@db/schema");

      return db
        .select({
          streamId: students.streamId,
          streamName: streamsTable.name,
          streamGrade: streamsTable.grade,
          totalPocketMoney: sql<string>`SUM(${students.pocketMoneyBalance})`,
          studentCount: sql<number>`COUNT(*)`,
          students: sql<string>`JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', ${students.id},
              'firstName', ${students.firstName},
              'lastName', ${students.lastName},
              'admissionNumber', ${students.admissionNumber},
              'pocketMoneyBalance', ${students.pocketMoneyBalance},
              'parentName', ${students.parentName},
              'parentPhone', ${students.parentPhone}
            )
          )`,
        })
        .from(students)
        .leftJoin(streamsTable, eq(students.streamId, streamsTable.id))
        .where(eq(students.schoolId, input.schoolId))
        .groupBy(students.streamId, streamsTable.name, streamsTable.grade)
        .orderBy(streamsTable.grade, streamsTable.name);
    }),
});
