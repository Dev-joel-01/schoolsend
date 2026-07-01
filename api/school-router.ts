import { z } from "zod";
import { eq, count, sum, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { schools, schoolUsers, students, payments, adminSettings } from "@db/schema";
import { generateSchoolCode, formatPhoneNumber } from "./utils/helpers";

export const schoolRouter = createRouter({
  // Get all schools (admin only)
  list: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(schools).orderBy(schools.createdAt);
  }),

  // Get single school by ID
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, input.id));
      return school || null;
    }),

  // Get school by code (public - for parent payment flow)
  getByCode: publicQuery
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.code, input.code));
      return school || null;
    }),

  // Get school by user (for logged-in principal)
  getMySchool: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const user = ctx.user;
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }
    const userId = user.id;
    const [schoolUser] = await db
      .select()
      .from(schoolUsers)
      .where(eq(schoolUsers.userId, userId));
    if (!schoolUser) return null;

    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolUser.schoolId));
    return school || null;
  }),

  // Register a new school (public signup)
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(3).max(255),
        email: z.string().email(),
        phone: z.string().min(10),
        address: z.string().optional(),
        paybillNumber: z.string().min(5),
        accountNumber: z.string().min(3),
        contactPerson: z.string().min(3),
        contactPhone: z.string().min(10),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const code = generateSchoolCode();
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Get subscription amount from admin settings
      const [settings] = await db.select().from(adminSettings).limit(1);
      const subAmount = settings?.subscriptionAmount || "2500.00";

      const [school] = await db.insert(schools).values({
        name: input.name,
        code,
        email: input.email,
        phone: formatPhoneNumber(input.phone),
        address: input.address || null,
        paybillNumber: input.paybillNumber,
        accountNumber: input.accountNumber,
        contactPerson: input.contactPerson,
        contactPhone: formatPhoneNumber(input.contactPhone),
        subscriptionAmount: subAmount,
        subscriptionStatus: "pending",
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
        smsBalance: 50, // Free starter SMS
        totalSmsSent: 0,
        isActive: true,
      });

      // TODO: Send email with school code
      console.log(`[EMAIL] School ${input.name} registered. Code: ${code}`);

      return { success: true, school, code };
    }),

  // Update school
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(3).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        paybillNumber: z.string().optional(),
        accountNumber: z.string().optional(),
        contactPerson: z.string().optional(),
        contactPhone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(schools).set(data).where(eq(schools.id, id));
      return { success: true };
    }),

  // Toggle school active status (admin)
  toggleStatus: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, input.id));
      if (!school) throw new Error("School not found");

      await db
        .update(schools)
        .set({ isActive: !school.isActive })
        .where(eq(schools.id, input.id));
      return { success: true, isActive: !school.isActive };
    }),

  // Get school statistics
  getStats: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const schoolId = input.schoolId;

      // Total students
      const [studentCount] = await db
        .select({ count: count() })
        .from(students)
        .where(eq(students.schoolId, schoolId));

      // Total fee balance
      const [feeBalance] = await db
        .select({ total: sum(students.feeBalance) })
        .from(students)
        .where(eq(students.schoolId, schoolId));

      // Total pocket money balance
      const [pocketBalance] = await db
        .select({ total: sum(students.pocketMoneyBalance) })
        .from(students)
        .where(eq(students.schoolId, schoolId));

      // Total payments received
      const [paymentsTotal] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.schoolId, schoolId),
            eq(payments.status, "completed")
          )
        );

      return {
        totalStudents: studentCount?.count || 0,
        totalFeeBalance: feeBalance?.total || "0",
        totalPocketMoney: pocketBalance?.total || "0",
        totalPaymentsReceived: paymentsTotal?.total || "0",
      };
    }),

  // Renew subscription
  renewSubscription: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await db
        .update(schools)
        .set({
          subscriptionStatus: "active",
          subscriptionStartDate: now,
          subscriptionEndDate: endDate,
        })
        .where(eq(schools.id, input.schoolId));

      return { success: true, newEndDate: endDate };
    }),
});
