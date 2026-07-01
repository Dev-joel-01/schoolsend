import { relations } from "drizzle-orm";
import {
  users,
  schools,
  schoolUsers,
  streams,
  students,
  payments,
  disbursements,
  smsLogs,
  subscriptionPayments,
  mpesaTransactions,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  schoolUsers: many(schoolUsers),
  disbursements: many(disbursements),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  schoolUsers: many(schoolUsers),
  streams: many(streams),
  students: many(students),
  payments: many(payments),
  disbursements: many(disbursements),
  smsLogs: many(smsLogs),
  subscriptionPayments: many(subscriptionPayments),
  mpesaTransactions: many(mpesaTransactions),
}));

export const schoolUsersRelations = relations(schoolUsers, ({ one }) => ({
  user: one(users, { fields: [schoolUsers.userId], references: [users.id] }),
  school: one(schools, {
    fields: [schoolUsers.schoolId],
    references: [schools.id],
  }),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  school: one(schools, { fields: [streams.schoolId], references: [schools.id] }),
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  stream: one(streams, {
    fields: [students.streamId],
    references: [streams.id],
  }),
  payments: many(payments),
  disbursements: many(disbursements),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  school: one(schools, {
    fields: [payments.schoolId],
    references: [schools.id],
  }),
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
}));

export const disbursementsRelations = relations(disbursements, ({ one }) => ({
  school: one(schools, {
    fields: [disbursements.schoolId],
    references: [schools.id],
  }),
  student: one(students, {
    fields: [disbursements.studentId],
    references: [students.id],
  }),
  disbursedByUser: one(users, {
    fields: [disbursements.disbursedBy],
    references: [users.id],
  }),
}));

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  school: one(schools, { fields: [smsLogs.schoolId], references: [schools.id] }),
}));

export const subscriptionPaymentsRelations = relations(
  subscriptionPayments,
  ({ one }) => ({
    school: one(schools, {
      fields: [subscriptionPayments.schoolId],
      references: [schools.id],
    }),
  })
);

export const mpesaTransactionsRelations = relations(
  mpesaTransactions,
  ({ one }) => ({
    school: one(schools, {
      fields: [mpesaTransactions.schoolId],
      references: [schools.id],
    }),
    student: one(students, {
      fields: [mpesaTransactions.studentId],
      references: [students.id],
    }),
  })
);
