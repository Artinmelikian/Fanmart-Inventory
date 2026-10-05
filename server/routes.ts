import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertItemSchema, updateItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all items
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Get single item
  app.get("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }
      
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  // Create new item
  app.post("/api/items", async (req, res) => {
    try {
      const validatedData = insertItemSchema.parse(req.body);
      const newItem = await storage.createItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid item data", details: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  // Update item
  app.patch("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }
      
      const validatedData = updateItemSchema.parse(req.body);
      const updatedItem = await storage.updateItem(id, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid item data", details: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete item
  app.delete("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid item ID" });
      }
      
      await storage.deleteItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Reorder items
  const reorderItemsSchema = z.object({
    itemIds: z.array(z.number().int().positive()),
  });

  app.post("/api/items/reorder", async (req, res) => {
    try {
      const { itemIds } = reorderItemsSchema.parse(req.body);
      await storage.reorderItems(itemIds);
      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder data", details: error.errors });
      }
      console.error("Error reordering items:", error);
      res.status(500).json({ error: "Failed to reorder items" });
    }
  });

  // Get all sales
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getAllSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  // Record a sale
  const recordSaleSchema = z.object({
    itemId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    description: z.string().optional(),
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const { itemId, quantity, description } = recordSaleSchema.parse(req.body);

      const sale = await storage.recordSale(itemId, quantity, description);
      res.json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid sale data", details: error.errors });
      }
      
      if (error instanceof Error) {
        if (error.message === "Item not found") {
          return res.status(404).json({ error: "Item not found" });
        }
        if (error.message.includes("Insufficient stock")) {
          const match = error.message.match(/Available: (\d+), Requested: (\d+)/);
          if (match) {
            return res.status(400).json({ 
              error: "Insufficient stock", 
              available: parseInt(match[1]),
              requested: parseInt(match[2])
            });
          }
          return res.status(400).json({ error: error.message });
        }
      }
      
      console.error("Error recording sale:", error);
      res.status(500).json({ error: "Failed to record sale" });
    }
  });

  // Return a sale
  app.post("/api/sales/:id/return", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid sale ID" });
      }
      
      await storage.returnSale(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Sale not found") {
          return res.status(404).json({ error: "Sale not found" });
        }
        if (error.message === "Item not found") {
          return res.status(409).json({ error: "Cannot return sale: the associated item no longer exists in inventory" });
        }
      }
      
      console.error("Error returning sale:", error);
      res.status(500).json({ error: "Failed to return sale" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
