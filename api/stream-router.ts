import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { streams } from "@db/schema";

export const streamRouter = createRouter({
  // Get streams by school
  list: authedQuery
    .input(z.object({ schoolId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(streams)
        .where(eq(streams.schoolId, input.schoolId))
        .orderBy(streams.grade, streams.name);
    }),

  // Create stream
  create: authedQuery
    .input(
      z.object({
        schoolId: z.number(),
        name: z.string().min(1),
        grade: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [stream] = await db.insert(streams).values(input);
      return { success: true, stream };
    }),

  // Update stream
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        grade: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(streams).set(data).where(eq(streams.id, id));
      return { success: true };
    }),

  // Delete stream
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(streams).where(eq(streams.id, input.id));
      return { success: true };
    }),
});
