import { z } from "zod";
import { eq, and, count, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { smsLogs, schools } from "@db/schema";

export const smsRouter = createRouter({
  // Get SMS logs for school
  list: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        type: z.enum([
          "disbursement",
          "payment_confirmation",
          "fee_reminder",
          "bulk",
          "welcome",
          "other",
        ]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(smsLogs.schoolId, input.schoolId)];
      if (input.type) conditions.push(eq(smsLogs.type, input.type));

      return db
        .select()
        .from(smsLogs)
        .where(and(...conditions))
        .orderBy(desc(smsLogs.createdAt));
    }),

  // Send single SMS
  send: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        phone: z.string(),
        message: z.string().min(1).max(480),
        type: z.enum([
          "disbursement",
          "payment_confirmation",
          "fee_reminder",
          "bulk",
          "welcome",
          "other",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check SMS balance
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, input.schoolId));

      if (!school) throw new Error("School not found");
      if (school.smsBalance <= 0) throw new Error("Insufficient SMS balance");

      // Simulate SMS sending (production: integrate MobiTech)
      const smsResult: { success: boolean; data?: { messageId: string }; error?: string } = {
        success: true,
        data: { messageId: `SMS${Date.now()}` },
      };

      // Log SMS
      await db.insert(smsLogs).values({
        schoolId: input.schoolId,
        recipientPhone: input.phone,
        message: input.message,
        type: input.type,
        status: smsResult.success ? "sent" : "failed",
        cost: 1,
        responseData: smsResult.data ? { messageId: smsResult.data.messageId } : { error: smsResult.error || "Unknown error" },
      });

      // Deduct SMS balance
      if (smsResult.success) {
        await db
          .update(schools)
          .set({
            smsBalance: school.smsBalance - 1,
            totalSmsSent: school.totalSmsSent + 1,
          })
          .where(eq(schools.id, input.schoolId));
      }

      return { success: smsResult.success, messageId: smsResult.data?.messageId };
    }),

  // Send bulk SMS
  sendBulk: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        phones: z.array(z.string()),
        message: z.string().min(1).max(480),
        type: z.enum(["bulk", "fee_reminder", "other"]).default("bulk"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check SMS balance
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, input.schoolId));

      if (!school) throw new Error("School not found");
      if (school.smsBalance < input.phones.length) {
        throw new Error(
          `Insufficient SMS balance. Need ${input.phones.length}, have ${school.smsBalance}`
        );
      }

      let sent = 0;
      let failed = 0;

      for (const phone of input.phones) {
        try {
          await db.insert(smsLogs).values({
            schoolId: input.schoolId,
            recipientPhone: phone,
            message: input.message,
            type: input.type,
            status: "sent",
            cost: 1,
          });
          sent++;
        } catch {
          failed++;
        }
      }

      // Deduct balance
      await db
        .update(schools)
        .set({
          smsBalance: school.smsBalance - sent,
          totalSmsSent: school.totalSmsSent + sent,
        })
        .where(eq(schools.id, input.schoolId));

      return { success: true, sent, failed };
    }),

  // Top up SMS balance
  topUp: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        amount: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, input.schoolId));

      if (!school) throw new Error("School not found");

      await db
        .update(schools)
        .set({ smsBalance: school.smsBalance + input.amount })
        .where(eq(schools.id, input.schoolId));

      return {
        success: true,
        newBalance: school.smsBalance + input.amount,
      };
    }),

  // Get SMS stats
  getStats: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const [totalSent] = await db
        .select({ count: count() })
        .from(smsLogs)
        .where(eq(smsLogs.schoolId, input.schoolId));

      const [recentSent] = await db
        .select({ count: count() })
        .from(smsLogs)
        .where(
          and(
            eq(smsLogs.schoolId, input.schoolId),
            eq(smsLogs.status, "sent")
          )
        );

      const [recentFailed] = await db
        .select({ count: count() })
        .from(smsLogs)
        .where(
          and(
            eq(smsLogs.schoolId, input.schoolId),
            eq(smsLogs.status, "failed")
          )
        );

      const [school] = await db
        .select({ smsBalance: schools.smsBalance })
        .from(schools)
        .where(eq(schools.id, input.schoolId));

      return {
        totalSent: totalSent?.count || 0,
        sent: recentSent?.count || 0,
        failed: recentFailed?.count || 0,
        smsBalance: school?.smsBalance || 0,
      };
    }),
});
