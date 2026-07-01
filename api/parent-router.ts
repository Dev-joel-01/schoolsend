import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { schools, students, streams } from "@db/schema";

export const parentRouter = createRouter({
  // Verify school code and return school info
  verifySchoolCode: publicQuery
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [school] = await db
        .select({
          id: schools.id,
          name: schools.name,
          code: schools.code,
          paybillNumber: schools.paybillNumber,
          accountNumber: schools.accountNumber,
          isActive: schools.isActive,
          subscriptionStatus: schools.subscriptionStatus,
        })
        .from(schools)
        .where(eq(schools.code, input.code));

      if (!school) return { valid: false, message: "Invalid school code" };
      if (!school.isActive)
        return { valid: false, message: "School account is inactive" };
      if (school.subscriptionStatus !== "active")
        return { valid: false, message: "School subscription is not active" };

      return { valid: true, school };
    }),

  // Get classes/streams for a school
  getStreams: publicQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(streams)
        .where(eq(streams.schoolId, input.schoolId))
        .orderBy(streams.grade, streams.name);
    }),

  // Get students in a stream (simplified for parent view)
  getStudentsByStream: publicQuery
    .input(z.object({ streamId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          admissionNumber: students.admissionNumber,
          feeBalance: students.feeBalance,
          pocketMoneyBalance: students.pocketMoneyBalance,
        })
        .from(students)
        .where(eq(students.streamId, input.streamId))
        .orderBy(students.firstName, students.lastName);
    }),

  // Get student details for payment
  getStudentForPayment: publicQuery
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [result] = await db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          admissionNumber: students.admissionNumber,
          feeBalance: students.feeBalance,
          pocketMoneyBalance: students.pocketMoneyBalance,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          streamName: streams.name,
          schoolName: schools.name,
          schoolPaybill: schools.paybillNumber,
          schoolAccount: schools.accountNumber,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .leftJoin(schools, eq(students.schoolId, schools.id))
        .where(eq(students.id, input.studentId));

      return result || null;
    }),
});
