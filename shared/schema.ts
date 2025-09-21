import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For agent info, search results, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type", { enum: ["reasoning", "search", "creative"] }).notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  role: true,
  content: true,
  metadata: true,
});

export const insertAgentSchema = createInsertSchema(agents).pick({
  name: true,
  type: true,
  description: true,
  isActive: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

// WebSocket message types
export const wsMessageSchema = z.object({
  type: z.enum(["user_message", "agent_status", "assistant_response", "typing_start", "typing_stop"]),
  conversationId: z.string(),
  content: z.string().optional(),
  agentType: z.enum(["reasoning", "search", "creative"]).optional(),
  metadata: z.any().optional(),
});

export type WSMessage = z.infer<typeof wsMessageSchema>;
