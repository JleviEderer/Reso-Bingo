import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { db } from "./db";
import { boards, userLists, type BingoSquare } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const bingoSquareSchema = z.object({
  text: z.string().min(1).max(500),
  isBoss: z.boolean(),
  marked: z.boolean(),
});

const boardRequestSchema = z.object({
  squares: z.array(bingoSquareSchema).length(25),
});

const listsRequestSchema = z.object({
  standard: z.array(z.string().min(1).max(500)).min(24),
  boss: z.array(z.string().min(1).max(500)).min(1),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/board", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const [board] = await db.select().from(boards).where(eq(boards.userId, userId));
      
      if (!board) {
        return res.json(null);
      }
      
      res.json({
        squares: board.squares,
        createdAt: board.createdAt?.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching board:", error);
      res.status(500).json({ message: "Failed to fetch board" });
    }
  });

  app.post("/api/board", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const parseResult = boardRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid board data", errors: parseResult.error.errors });
      }
      
      const { squares } = parseResult.data;
      const boardId = `${userId}-2026`;
      
      await db.insert(boards)
        .values({
          id: boardId,
          userId,
          squares: squares as BingoSquare[],
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: boards.id,
          set: {
            squares: squares as BingoSquare[],
            updatedAt: new Date(),
          },
        });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving board:", error);
      res.status(500).json({ message: "Failed to save board" });
    }
  });

  app.get("/api/lists", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const [lists] = await db.select().from(userLists).where(eq(userLists.userId, userId));
      
      if (!lists) {
        return res.json({ standard: [], boss: [] });
      }
      
      res.json({
        standard: lists.standardResolutions,
        boss: lists.bossResolutions,
      });
    } catch (error) {
      console.error("Error fetching lists:", error);
      res.status(500).json({ message: "Failed to fetch lists" });
    }
  });

  app.post("/api/lists", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const parseResult = listsRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid lists data", errors: parseResult.error.errors });
      }
      
      const { standard, boss } = parseResult.data;

      await db.insert(userLists)
        .values({
          userId,
          standardResolutions: standard,
          bossResolutions: boss,
        })
        .onConflictDoUpdate({
          target: userLists.userId,
          set: {
            standardResolutions: standard,
            bossResolutions: boss,
            updatedAt: new Date(),
          },
        });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving lists:", error);
      res.status(500).json({ message: "Failed to save lists" });
    }
  });

  return httpServer;
}
