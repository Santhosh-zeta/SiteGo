-- Create material master table
CREATE TABLE IF NOT EXISTS material_master (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL, -- kg, ton, bag, piece, etc.
  qr_code VARCHAR(255) UNIQUE,
  barcode VARCHAR(255) UNIQUE,
  description TEXT,
  standard_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create material inventory per site
CREATE TABLE IF NOT EXISTS material_inventory (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES material_master(id) ON DELETE CASCADE,
  quantity_received DECIMAL(10,2) DEFAULT 0,
  quantity_used DECIMAL(10,2) DEFAULT 0,
  quantity_available DECIMAL(10,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, material_id)
);

-- Create material transaction logs
CREATE TABLE IF NOT EXISTS material_logs (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES material_master(id) ON DELETE CASCADE,
  logged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  log_type VARCHAR(50) NOT NULL, -- 'received', 'used', 'moved', 'returned'
  quantity DECIMAL(10,2) NOT NULL,
  notes TEXT,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_material_master_category ON material_master(category);
CREATE INDEX idx_material_master_qr ON material_master(qr_code);
CREATE INDEX idx_material_inventory_site ON material_inventory(site_id);
CREATE INDEX idx_material_inventory_material ON material_inventory(material_id);
CREATE INDEX idx_material_logs_site ON material_logs(site_id);
CREATE INDEX idx_material_logs_date ON material_logs(transaction_date);

-- Triggers for updated_at
CREATE TRIGGER update_material_master_updated_at
BEFORE UPDATE ON material_master
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_inventory_updated_at
BEFORE UPDATE ON material_inventory
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
