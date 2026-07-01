import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  bigint,
  json,
  boolean,
  date,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users (OAuth from Kimi) ─────────────────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Schools ──────────────────────────────────────────────────────────
export const schools = mysqlTable(
  "schools",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    address: text("address"),
    paybillNumber: varchar("paybill_number", { length: 20 }).notNull(),
    accountNumber: varchar("account_number", { length: 100 }).notNull(),
    contactPerson: varchar("contact_person", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    subscriptionAmount: decimal("subscription_amount", {
      precision: 10,
      scale: 2,
    })
      .default("2500.00")
      .notNull(),
    subscriptionStatus: mysqlEnum("subscription_status", [
      "active",
      "expired",
      "suspended",
      "pending",
    ])
      .default("pending")
      .notNull(),
    subscriptionStartDate: date("subscription_start_date"),
    subscriptionEndDate: date("subscription_end_date"),
    smsBalance: int("sms_balance").default(0).notNull(),
    totalSmsSent: int("total_sms_sent").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("school_code_idx").on(table.code),
    index("school_status_idx").on(table.subscriptionStatus),
  ]
);

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

// ─── School Users (link OAuth users to schools as principals) ─────────
export const schoolUsers = mysqlTable(
  "school_users",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: bigint("school_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["principal", "bursar", "secretary"])
      .default("principal")
      .notNull(),
    isPrimary: boolean("is_primary").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("school_user_idx").on(table.userId, table.schoolId),
  ]
);

// ─── Streams / Classes ────────────────────────────────────────────────
export const streams = mysqlTable(
  "streams",
  {
    id: serial("id").primaryKey(),
    schoolId: bigint("school_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    grade: varchar("grade", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("stream_school_idx").on(table.schoolId)]
);

export type Stream = typeof streams.$inferSelect;
export type InsertStream = typeof streams.$inferInsert;

// ─── Students ─────────────────────────────────────────────────────────
export const students = mysqlTable(
  "students",
  {
    id: serial("id").primaryKey(),
    schoolId: bigint("school_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    streamId: bigint("stream_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => streams.id, { onDelete: "cascade" }),
    admissionNumber: varchar("admission_number", { length: 50 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    parentName: varchar("parent_name", { length: 255 }).notNull(),
    parentPhone: varchar("parent_phone", { length: 20 }).notNull(),
    parentEmail: varchar("parent_email", { length: 320 }),
    feeBalance: decimal("fee_balance", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    pocketMoneyBalance: decimal("pocket_money_balance", {
      precision: 10,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("student_school_idx").on(table.schoolId),
    index("student_stream_idx").on(table.streamId),
    index("student_admission_idx").on(table.admissionNumber),
  ]
);

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ─── Payments (fees and pocket money from parents) ────────────────────
export const payments = mysqlTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    schoolId: bigint("school_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    studentId: bigint("student_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["fees", "pocket_money"]).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    mpesaReceipt: varchar("mpesa_receipt", { length: 100 }),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"])
      .default("pending")
      .notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("payment_school_idx").on(table.schoolId),
    index("payment_student_idx").on(table.studentId),
    index("payment_status_idx").on(table.status),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Disbursements (pocket money given to students) ───────────────────
export const disbursements = mysqlTable(
  "disbursements",
  {
    id: serial("id").primaryKey(),
    schoolId: bigint("school_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    studentId: bigint("student_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    disbursedBy: bigint("disbursed_by", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id),
    notes: text("notes"),
    smsSent: boolean("sms_sent").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("disbursement_school_idx").on(table.schoolId),
    index("disbursement_student_idx").on(table.studentId),
  ]
);

export type Disbursement = typeof disbursements.$inferSelect;

// ─── SMS Logs ─────────────────────────────────────────────────────────
export const smsLogs = mysqlTable(
  "sms_logs",
  {
    id: serial("id").primaryKey(),
    schoolId: bigint("school_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
    message: text("message").notNull(),
    type: mysqlEnum("type", [
      "disbursement",
      "payment_confirmation",
      "fee_reminder",
      "bulk",
      "welcome",
      "other",
    ]).notNull(),
    status: mysqlEnum("status", ["pending", "sent", "failed", "delivered"])
      .default("pending")
      .notNull(),
    cost: int("cost").default(1).notNull(),
    responseData: json("response_data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("sms_school_idx").on(table.schoolId),
    index("sms_status_idx").on(table.status),
  ]
);

export type SmsLog = typeof smsLogs.$inferSelect;

// ─── Subscription Payments ────────────────────────────────────────────
export const subscriptionPayments = mysqlTable(
  "subscription_payments",
  {
    id: serial("id").primaryKey(),
    schoolId: bigint("school_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    mpesaReceipt: varchar("mpesa_receipt", { length: 100 }),
    status: mysqlEnum("status", ["pending", "completed", "failed"])
      .default("pending")
      .notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("sub_payment_school_idx").on(table.schoolId)]
);

export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;

// ─── M-Pesa Transactions ──────────────────────────────────────────────
export const mpesaTransactions = mysqlTable(
  "mpesa_transactions",
  {
    id: serial("id").primaryKey(),
    schoolId: bigint("school_id", { mode: "number", unsigned: true })
      .references(() => schools.id, { onDelete: "set null" }),
    studentId: bigint("student_id", { mode: "number", unsigned: true })
      .references(() => students.id, { onDelete: "set null" }),
    transactionType: mysqlEnum("transaction_type", [
      "c2b",
      "stk_push",
      "b2c",
      "subscription",
    ]).notNull(),
    merchantRequestId: varchar("merchant_request_id", { length: 255 }),
    checkoutRequestId: varchar("checkout_request_id", { length: 255 }),
    mpesaReceipt: varchar("mpesa_receipt", { length: 100 }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    resultCode: int("result_code"),
    resultDesc: varchar("result_desc", { length: 255 }),
    rawCallback: json("raw_callback"),
    status: mysqlEnum("status", ["pending", "success", "failed"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("mpesa_school_idx").on(table.schoolId),
    index("mpesa_receipt_idx").on(table.mpesaReceipt),
    index("mpesa_checkout_idx").on(table.checkoutRequestId),
  ]
);

export type MpesaTransaction = typeof mpesaTransactions.$inferSelect;

// ─── Admin Settings ───────────────────────────────────────────────────
export const adminSettings = mysqlTable("admin_settings", {
  id: serial("id").primaryKey(),
  adminPaybill: varchar("admin_paybill", { length: 20 })
    .default("4189489")
    .notNull(),
  subscriptionAmount: decimal("subscription_amount", {
    precision: 10,
    scale: 2,
  })
    .default("2500.00")
    .notNull(),
  smsProvider: varchar("sms_provider", { length: 100 }).default("mobitech"),
  smsApiKey: text("sms_api_key"),
  smsSenderId: varchar("sms_sender_id", { length: 20 }).default("EDUPAY"),
  darajaConsumerKey: text("daraja_consumer_key"),
  darajaConsumerSecret: text("daraja_consumer_secret"),
  darajaPasskey: text("daraja_passkey"),
  darajaShortcode: varchar("daraja_shortcode", { length: 20 }),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AdminSettings = typeof adminSettings.$inferSelect;
