process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const setupDb = async () => {
  const client = await pool.connect();
  try {
    console.log("Connected to database...");

    // 1. Create Tables
    console.log("Creating tables...");
    
    // Budget Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget (
        id VARCHAR(50) PRIMARY KEY,
        amount NUMERIC(10, 2) DEFAULT 0
      );
    `);

    // Planned Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS planned_items (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        target_quantity INTEGER NOT NULL DEFAULT 1,
        purchased_quantity INTEGER NOT NULL DEFAULT 0,
        price_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0
      );
    `);

    // Actual Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS actual_items (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
        date DATE NOT NULL,
        planned_item_id VARCHAR(50) REFERENCES planned_items(id) ON DELETE SET NULL
      );
    `);

    // 2. Create Triggers for Automatic Updates
    console.log("Creating triggers...");

    // Function to update purchased_quantity
    await client.query(`
      CREATE OR REPLACE FUNCTION update_planned_quantity() RETURNS TRIGGER AS $$
      BEGIN
        -- On INSERT
        IF (TG_OP = 'INSERT') THEN
          IF (NEW.planned_item_id IS NOT NULL) THEN
            UPDATE planned_items 
            SET purchased_quantity = purchased_quantity + NEW.quantity
            WHERE id = NEW.planned_item_id;
          END IF;
          RETURN NEW;
        
        -- On DELETE
        ELSIF (TG_OP = 'DELETE') THEN
          IF (OLD.planned_item_id IS NOT NULL) THEN
            UPDATE planned_items 
            SET purchased_quantity = purchased_quantity - OLD.quantity
            WHERE id = OLD.planned_item_id;
          END IF;
          RETURN OLD;
        
        -- On UPDATE
        ELSIF (TG_OP = 'UPDATE') THEN
          -- If quantity changed or link changed, we need to adjust
          -- Simplest way: revert OLD, apply NEW
          
          -- Revert OLD
          IF (OLD.planned_item_id IS NOT NULL) THEN
            UPDATE planned_items 
            SET purchased_quantity = purchased_quantity - OLD.quantity
            WHERE id = OLD.planned_item_id;
          END IF;

          -- Apply NEW
          IF (NEW.planned_item_id IS NOT NULL) THEN
            UPDATE planned_items 
            SET purchased_quantity = purchased_quantity + NEW.quantity
            WHERE id = NEW.planned_item_id;
          END IF;
          
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger Definition
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_planned_qty ON actual_items;
      CREATE TRIGGER trigger_update_planned_qty
      AFTER INSERT OR UPDATE OR DELETE ON actual_items
      FOR EACH ROW EXECUTE FUNCTION update_planned_quantity();
    `);

    console.log("Database setup complete!");

  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    client.release();
    await pool.end();
  }
};

setupDb();
