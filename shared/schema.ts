import { pgTable, text, varchar, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (users, sessions tables)
export * from "./models/auth";

// Bingo square schema
export const bingoSquareSchema = z.object({
  text: z.string(),
  isBoss: z.boolean(),
  marked: z.boolean(),
});

export type BingoSquare = z.infer<typeof bingoSquareSchema>;

// User boards table - stores bingo boards per user
export const boards = pgTable("boards", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  squares: jsonb("squares").$type<BingoSquare[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User resolution lists table - stores user's custom resolutions
export const userLists = pgTable("user_lists", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  standardResolutions: jsonb("standard_resolutions").$type<string[]>().notNull().default([]),
  bossResolutions: jsonb("boss_resolutions").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBoardSchema = createInsertSchema(boards);
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Board = typeof boards.$inferSelect;

export const insertUserListsSchema = createInsertSchema(userLists);
export type InsertUserLists = z.infer<typeof insertUserListsSchema>;
export type UserLists = typeof userLists.$inferSelect;
