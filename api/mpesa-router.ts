import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { mpesaTransactions, payments, students } from "@db/schema";

// M-Pesa Daraja API helpers
async function getAccessToken(
  consumerKey: string,
  consumerSecret: string
): Promise<string> {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );
  const response = await fetch(
    "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

function generateTimestamp(): string {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
}

export const mpesaRouter = createRouter({
  // Initiate STK Push (for parent payment)
  initiateStkPush: publicQuery
    .input(
      z.object({
        phoneNumber: z.string(),
        amount: z.number(),
        accountReference: z.string(),
        transactionDesc: z.string(),
        schoolId: z.number(),
        studentId: z.number(),
        paymentType: z.enum(["fees", "pocket_money"]),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const db = getDb();

        // Get M-Pesa settings from admin settings
        const { adminSettings } = await import("@db/schema");
        const [settings] = await db.select().from(adminSettings).limit(1);

        if (!settings?.darajaConsumerKey || !settings?.darajaPasskey) {
          // For demo without actual credentials, simulate
          const mockCheckoutId = `ws_${Date.now()}`;

          // Create pending transaction
          await db.insert(mpesaTransactions).values({
            schoolId: input.schoolId,
            studentId: input.studentId,
            transactionType: "stk_push",
            checkoutRequestId: mockCheckoutId,
            amount: input.amount.toFixed(2),
            phoneNumber: input.phoneNumber,
            status: "pending",
          });

          // Create pending payment record
          await db.insert(payments).values({
            schoolId: input.schoolId,
            studentId: input.studentId,
            type: input.paymentType,
            amount: input.amount.toFixed(2),
            phoneNumber: input.phoneNumber,
            status: "pending",
          });

          return {
            success: true,
            checkoutRequestId: mockCheckoutId,
            message: "STK Push simulated (demo mode)",
            merchantRequestId: `MR${Date.now()}`,
          };
        }

        // Production: Use actual Daraja API
        const accessToken = await getAccessToken(
          settings.darajaConsumerKey,
          settings.darajaConsumerSecret || ""
        );

        const timestamp = generateTimestamp();
        const shortcode = settings.darajaShortcode || "174379";
        const password = generatePassword(
          shortcode,
          settings.darajaPasskey,
          timestamp
        );

        const callbackUrl = `${process.env.API_BASE_URL || ""}/api/trpc/mpesa.callback`;

        const response = await fetch(
          "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              BusinessShortCode: shortcode,
              Password: password,
              Timestamp: timestamp,
              TransactionType: "CustomerPayBillOnline",
              Amount: input.amount,
              PartyA: input.phoneNumber,
              PartyB: shortcode,
              PhoneNumber: input.phoneNumber,
              CallBackURL: callbackUrl,
              AccountReference: input.accountReference,
              TransactionDesc: input.transactionDesc,
            }),
          }
        );

        const data = (await response.json()) as {
          ResponseCode: string;
          ResponseDescription: string;
          MerchantRequestID: string;
          CheckoutRequestID: string;
        };

        if (data.ResponseCode === "0") {
          // Store transaction
          await db.insert(mpesaTransactions).values({
            schoolId: input.schoolId,
            studentId: input.studentId,
            transactionType: "stk_push",
            merchantRequestId: data.MerchantRequestID,
            checkoutRequestId: data.CheckoutRequestID,
            amount: input.amount.toFixed(2),
            phoneNumber: input.phoneNumber,
            status: "pending",
          });

          // Create pending payment
          await db.insert(payments).values({
            schoolId: input.schoolId,
            studentId: input.studentId,
            type: input.paymentType,
            amount: input.amount.toFixed(2),
            phoneNumber: input.phoneNumber,
            status: "pending",
          });

          return {
            success: true,
            checkoutRequestId: data.CheckoutRequestID,
            merchantRequestId: data.MerchantRequestID,
          };
        } else {
          return {
            success: false,
            error: data.ResponseDescription || "STK Push failed",
          };
        }
      } catch (error) {
        console.error("M-Pesa STK Push error:", error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    }),

  // M-Pesa callback (called by Safaricom)
  callback: publicQuery
    .input(
      z.object({
        Body: z.object({
          stkCallback: z.object({
            MerchantRequestID: z.string(),
            CheckoutRequestID: z.string(),
            ResultCode: z.number(),
            ResultDesc: z.string(),
            CallbackMetadata: z
              .object({
                Item: z.array(
                  z.object({
                    Name: z.string(),
                    Value: z.union([z.string(), z.number()]).optional(),
                  })
                ),
              })
              .optional(),
          }),
        }),
      })
    )
    .mutation(async ({ input }: any) => {
      const db = getDb();
      const { stkCallback } = input.Body;

      const mpesaReceipt = stkCallback.CallbackMetadata?.Item.find(
        (i: any) => i.Name === "MpesaReceiptNumber"
      )?.Value;

      // Update transaction
      await db
        .update(mpesaTransactions)
        .set({
          status: stkCallback.ResultCode === 0 ? "success" : "failed",
          resultCode: stkCallback.ResultCode,
          resultDesc: stkCallback.ResultDesc,
          mpesaReceipt: mpesaReceipt?.toString() || null,
          rawCallback: input.Body as any,
        })
        .where(
          eq(
            mpesaTransactions.checkoutRequestId,
            stkCallback.CheckoutRequestID
          )
        );

      // Update payment record
      const [transaction] = await db
        .select()
        .from(mpesaTransactions)
        .where(
          eq(
            mpesaTransactions.checkoutRequestId,
            stkCallback.CheckoutRequestID
          )
        );

      if (transaction) {
        await db
          .update(payments)
          .set({
            status: stkCallback.ResultCode === 0 ? "completed" : "failed",
            mpesaReceipt: mpesaReceipt?.toString() || null,
          })
          .where(eq(payments.id, transaction.studentId || 0));

        // If successful, update student balance
        if (stkCallback.ResultCode === 0 && transaction.studentId) {
          const [student] = await db
            .select()
            .from(students)
            .where(eq(students.id, transaction.studentId));

          if (student) {
            // Find the actual pending payment by student
            const allPayments = await db
              .select()
              .from(payments)
              .where(eq(payments.studentId, transaction.studentId))
              .orderBy(payments.createdAt);

            const pendingPayment = allPayments.find(
              (p) => p.status === "pending"
            );

            if (pendingPayment) {
              const currentBalance =
                pendingPayment.type === "fees"
                  ? parseFloat(student.feeBalance)
                  : parseFloat(student.pocketMoneyBalance);
              const newBalance = (
                currentBalance - parseFloat(pendingPayment.amount)
              ).toFixed(2);

              await db
                .update(students)
                .set(
                  pendingPayment.type === "fees"
                    ? { feeBalance: newBalance }
                    : { pocketMoneyBalance: newBalance }
                )
                .where(eq(students.id, transaction.studentId));

              await db
                .update(payments)
                .set({ status: "completed" })
                .where(eq(payments.id, pendingPayment.id));
            }
          }
        }
      }

      return { success: true };
    }),

  // Query transaction status
  queryStatus: publicQuery
    .input(z.object({ checkoutRequestId: z.string() }))
    .query(async ({ input }: any) => {
      const db = getDb();
      const [transaction] = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.checkoutRequestId, input.checkoutRequestId));
      return transaction || null;
    }),
});
