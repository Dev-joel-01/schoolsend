import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { students, streams } from "@db/schema";

export const studentRouter = createRouter({
  // List students by school with optional stream filter
  list: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        streamId: z.number().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(students.schoolId, input.schoolId)];
      if (input.streamId) {
        conditions.push(eq(students.streamId, input.streamId));
      }

      const results = await db
        .select({
          student: students,
          streamName: streams.name,
          streamGrade: streams.grade,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .where(and(...conditions))
        .orderBy(students.firstName, students.lastName);

      return results;
    }),

  // Get single student
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [result] = await db
        .select({
          student: students,
          streamName: streams.name,
          streamGrade: streams.grade,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .where(eq(students.id, input.id));
      return result || null;
    }),

  // Get students by stream (public - for parent payment flow)
  getByStream: authedQuery
    .input(z.object({ streamId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(students)
        .where(eq(students.streamId, input.streamId))
        .orderBy(students.firstName);
    }),

  // Create student
  create: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        streamId: z.number(),
        admissionNumber: z.string().min(1),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        parentName: z.string().min(1),
        parentPhone: z.string().min(10),
        parentEmail: z.string().email().optional(),
        feeBalance: z.string().optional(),
        pocketMoneyBalance: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [student] = await db.insert(students).values({
        ...input,
        parentEmail: input.parentEmail || null,
        feeBalance: input.feeBalance || "0.00",
        pocketMoneyBalance: input.pocketMoneyBalance || "0.00",
      });
      return { success: true, student };
    }),

  // Update student
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        streamId: z.number().optional(),
        parentName: z.string().min(1).optional(),
        parentPhone: z.string().optional(),
        parentEmail: z.string().email().optional().nullable(),
        feeBalance: z.string().optional(),
        pocketMoneyBalance: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(students).set(data).where(eq(students.id, id));
      return { success: true };
    }),

  // Delete student
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(students).where(eq(students.id, input.id));
      return { success: true };
    }),

  // Get top students with highest fee balances
  getTopFeeBalances: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          student: students,
          streamName: streams.name,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .where(eq(students.schoolId, input.schoolId))
        .orderBy(desc(students.feeBalance))
        .limit(input.limit);
    }),

  // Get stream with highest total fee balance
  getStreamWithHighestFees: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select({
          streamId: students.streamId,
          streamName: streams.name,
          streamGrade: streams.grade,
          totalBalance: sql<string>`SUM(${students.feeBalance})`,
          studentCount: sql<number>`COUNT(*)`,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .where(eq(students.schoolId, input.schoolId))
        .groupBy(students.streamId, streams.name, streams.grade)
        .orderBy(sql`SUM(${students.feeBalance}) DESC`)
        .limit(1);

      return results[0] || null;
    }),
});
