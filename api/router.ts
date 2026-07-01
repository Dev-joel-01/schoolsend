import { authRouter } from "./auth-router";
import { schoolRouter } from "./school-router";
import { streamRouter } from "./stream-router";
import { studentRouter } from "./student-router";
import { paymentRouter } from "./payment-router";
import { disbursementRouter } from "./disbursement-router";
import { smsRouter } from "./sms-router";
import { dashboardRouter } from "./dashboard-router";
import { mpesaRouter } from "./mpesa-router";
import { parentRouter } from "./parent-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  school: schoolRouter,
  stream: streamRouter,
  student: studentRouter,
  payment: paymentRouter,
  disbursement: disbursementRouter,
  sms: smsRouter,
  dashboard: dashboardRouter,
  mpesa: mpesaRouter,
  parent: parentRouter,
});

export type AppRouter = typeof appRouter;
