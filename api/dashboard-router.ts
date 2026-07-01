import { z } from "zod";
import { eq, and, sum, count, desc, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  schools,
  students,
  payments,
  disbursements,
  smsLogs,
  streams,
} from "@db/schema";

export const dashboardRouter = createRouter({
  // School principal dashboard
  getSchoolDashboard: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const schoolId = input.schoolId;

      // Total students
      const [studentCount] = await db
        .select({ count: count() })
        .from(students)
        .where(eq(students.schoolId, schoolId));

      // Total fee balance across all students
      const [feeBalance] = await db
        .select({ total: sum(students.feeBalance) })
        .from(students)
        .where(eq(students.schoolId, schoolId));

      // Total pocket money received (completed payments)
      const [pocketMoneyReceived] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.schoolId, schoolId),
            eq(payments.type, "pocket_money"),
            eq(payments.status, "completed")
          )
        );

      // Total fees received
      const [feesReceived] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.schoolId, schoolId),
            eq(payments.type, "fees"),
            eq(payments.status, "completed")
          )
        );

      // Total transactions count
      const [transactionCount] = await db
        .select({ count: count() })
        .from(payments)
        .where(eq(payments.schoolId, schoolId));

      // Total disbursed
      const [totalDisbursed] = await db
        .select({ total: sum(disbursements.amount) })
        .from(disbursements)
        .where(eq(disbursements.schoolId, schoolId));

      // School info (subscription, SMS)
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, schoolId));

      // Stream with highest fee balance
      const streamWithHighestFees = await db
        .select({
          streamId: students.streamId,
          streamName: streams.name,
          streamGrade: streams.grade,
          totalBalance: sql<string>`SUM(${students.feeBalance})`,
          studentCount: sql<number>`COUNT(*)`,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .where(eq(students.schoolId, schoolId))
        .groupBy(students.streamId, streams.name, streams.grade)
        .orderBy(sql`SUM(${students.feeBalance}) DESC`)
        .limit(1);

      // Top 10 students with highest fee balances
      const topFeeBalances = await db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          admissionNumber: students.admissionNumber,
          feeBalance: students.feeBalance,
          parentName: students.parentName,
          parentPhone: students.parentPhone,
          streamName: streams.name,
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .where(eq(students.schoolId, schoolId))
        .orderBy(desc(students.feeBalance))
        .limit(10);

      // Recent payments
      const recentPayments = await db
        .select({
          id: payments.id,
          type: payments.type,
          amount: payments.amount,
          status: payments.status,
          phoneNumber: payments.phoneNumber,
          mpesaReceipt: payments.mpesaReceipt,
          createdAt: payments.createdAt,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
        })
        .from(payments)
        .leftJoin(students, eq(payments.studentId, students.id))
        .where(eq(payments.schoolId, schoolId))
        .orderBy(desc(payments.createdAt))
        .limit(10);

      // Payments by month (for chart)
      const paymentsByMonth = await db
        .select({
          month: sql<string>`DATE_FORMAT(${payments.createdAt}, '%Y-%m')`,
          fees: sql<string>`SUM(CASE WHEN ${payments.type} = 'fees' THEN ${payments.amount} ELSE 0 END)`,
          pocketMoney: sql<string>`SUM(CASE WHEN ${payments.type} = 'pocket_money' THEN ${payments.amount} ELSE 0 END)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(payments)
        .where(eq(payments.schoolId, schoolId))
        .groupBy(sql`DATE_FORMAT(${payments.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${payments.createdAt}, '%Y-%m')`)
        .limit(12);

      return {
        stats: {
          totalStudents: studentCount?.count || 0,
          totalFeeBalance: feeBalance?.total || "0",
          pocketMoneyReceived: pocketMoneyReceived?.total || "0",
          feesReceived: feesReceived?.total || "0",
          totalTransactions: transactionCount?.count || 0,
          totalDisbursed: totalDisbursed?.total || "0",
          smsBalance: school?.smsBalance || 0,
          subscriptionStatus: school?.subscriptionStatus || "unknown",
          subscriptionEndDate: school?.subscriptionEndDate || null,
        },
        streamWithHighestFees: streamWithHighestFees[0] || null,
        topFeeBalances,
        recentPayments,
        paymentsByMonth,
      };
    }),

  // Admin dashboard - all schools overview
  getAdminDashboard: adminQuery.query(async () => {
    const db = getDb();

    // Total schools
    const [schoolCount] = await db
      .select({ count: count() })
      .from(schools);

    // Active schools
    const [activeSchools] = await db
      .select({ count: count() })
      .from(schools)
      .where(eq(schools.isActive, true));

    // Total students across all schools
    const [studentCount] = await db
      .select({ count: count() })
      .from(students);

    // Total payments received
    const [totalPayments] = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.status, "completed"));

    // Total SMS sent
    const [smsCount] = await db
      .select({ count: count() })
      .from(smsLogs);

    // Schools with expiring subscriptions (within 7 days)
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSchools = await db
      .select()
      .from(schools)
      .where(
        and(
          eq(schools.isActive, true),
          sql`${schools.subscriptionEndDate} <= ${sevenDays}`
        )
      );

    // Recent school registrations
    const recentSchools = await db
      .select()
      .from(schools)
      .orderBy(desc(schools.createdAt))
      .limit(10);

    // Schools by subscription status
    const schoolsByStatus = await db
      .select({
        status: schools.subscriptionStatus,
        count: sql<number>`COUNT(*)`,
      })
      .from(schools)
      .groupBy(schools.subscriptionStatus);

    return {
      totalSchools: schoolCount?.count || 0,
      activeSchools: activeSchools?.count || 0,
      totalStudents: studentCount?.count || 0,
      totalPayments: totalPayments?.total || "0",
      totalSmsSent: smsCount?.count || 0,
      expiringSubscriptions: expiringSchools.length,
      recentSchools,
      schoolsByStatus,
    };
  }),
});
