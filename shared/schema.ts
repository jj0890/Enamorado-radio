import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  streamUrl: text("stream_url").notNull(),
  genre: text("genre").notNull(),
  description: text("description"),
  artworkUrl: text("artwork_url"),
  isLive: boolean("is_live").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  host: text("host").notNull(),
  description: text("description"),
  artworkUrl: text("artwork_url"),
  genre: text("genre").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration"), // in minutes
  isLive: boolean("is_live").default(false),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const currentPlayback = pgTable("current_playback", {
  id: serial("id").primaryKey(),
  stationId: integer("station_id").references(() => stations.id),
  showId: integer("show_id").references(() => shows.id),
  title: text("title").notNull(),
  artist: text("artist"),
  artwork: text("artwork"),
  startTime: timestamp("start_time").defaultNow(),
  isLive: boolean("is_live").default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStationSchema = createInsertSchema(stations).omit({
  id: true,
  createdAt: true,
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
});

export const insertCurrentPlaybackSchema = createInsertSchema(currentPlayback).omit({
  id: true,
  startTime: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type CurrentPlayback = typeof currentPlayback.$inferSelect;
export type InsertStation = z.infer<typeof insertStationSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertCurrentPlayback = z.infer<typeof insertCurrentPlaybackSchema>;
