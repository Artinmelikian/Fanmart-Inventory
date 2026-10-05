import { type User, type InsertUser, type Item, type InsertItem, type UpdateItem, type Sale, type InsertSale } from "@shared/schema";
import { db } from "./db";
import { items, sales } from "@shared/schema";
import { eq, asc, max, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: UpdateItem): Promise<Item | undefined>;
  deleteItem(id: number): Promise<void>;
  updateItemQuantity(id: number, quantity: number): Promise<Item | undefined>;
  reorderItems(itemIds: number[]): Promise<void>;
  
  getAllSales(): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  recordSale(itemId: number, quantity: number, description?: string): Promise<Sale>;
  returnSale(saleId: number): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("Not implemented");
  }

  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items).orderBy(asc(items.displayOrder), asc(items.id));
  }

  async getItem(id: number): Promise<Item | undefined> {
    const result = await db.select().from(items).where(eq(items.id, id));
    return result[0];
  }

  async createItem(item: InsertItem): Promise<Item> {
    const maxOrderResult = await db.select({ maxOrder: max(items.displayOrder) }).from(items);
    const maxOrder = maxOrderResult[0]?.maxOrder ?? 0;
    const result = await db.insert(items).values({ ...item, displayOrder: maxOrder + 1 }).returning();
    return result[0];
  }

  async updateItem(id: number, item: UpdateItem): Promise<Item | undefined> {
    const result = await db
      .update(items)
      .set(item)
      .where(eq(items.id, id))
      .returning();
    return result[0];
  }

  async deleteItem(id: number): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  async updateItemQuantity(id: number, quantity: number): Promise<Item | undefined> {
    const result = await db
      .update(items)
      .set({ quantity })
      .where(eq(items.id, id))
      .returning();
    return result[0];
  }

  async reorderItems(itemIds: number[]): Promise<void> {
    for (let i = 0; i < itemIds.length; i++) {
      await db
        .update(items)
        .set({ displayOrder: i + 1 })
        .where(eq(items.id, itemIds[i]));
    }
  }

  async getAllSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.saleDate));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const result = await db.insert(sales).values(sale).returning();
    return result[0];
  }

  async recordSale(itemId: number, quantity: number, description?: string): Promise<Sale> {
    return await db.transaction(async (tx) => {
      const itemResult = await tx.select().from(items).where(eq(items.id, itemId));
      const item = itemResult[0];
      
      if (!item) {
        throw new Error("Item not found");
      }
      
      const currentQuantity = parseInt(item.quantity.toString());
      if (currentQuantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${quantity}`);
      }
      
      const updateResult = await tx
        .update(items)
        .set({ quantity: sql`${items.quantity} - ${quantity}` })
        .where(sql`${items.id} = ${itemId} AND ${items.quantity} >= ${quantity}`)
        .returning();
      
      if (updateResult.length === 0) {
        throw new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${quantity}`);
      }
      
      const saleResult = await tx.insert(sales).values({
        itemId,
        itemName: item.name,
        quantitySold: quantity,
        flow: item.flow,
        description: description?.trim() || null,
        power: item.power,
        weight: item.weight,
        speed: item.speed,
      }).returning();
      
      return saleResult[0];
    });
  }

  async returnSale(saleId: number): Promise<void> {
    return await db.transaction(async (tx) => {
      const saleResult = await tx.select().from(sales).where(eq(sales.id, saleId));
      const sale = saleResult[0];
      
      if (!sale) {
        throw new Error("Sale not found");
      }
      
      const updateResult = await tx
        .update(items)
        .set({ quantity: sql`${items.quantity} + ${sale.quantitySold}` })
        .where(eq(items.id, sale.itemId))
        .returning();
      
      if (updateResult.length === 0) {
        throw new Error("Item not found");
      }
      
      await tx.delete(sales).where(eq(sales.id, saleId));
    });
  }
}

export const storage = new DbStorage();
