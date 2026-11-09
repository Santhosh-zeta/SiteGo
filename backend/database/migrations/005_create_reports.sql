-- Create report status enum
CREATE TYPE report_status AS ENUM ('pending', 'approved', 'rejected');

-- Create daily reports table
CREATE TABLE IF NOT EXISTS daily_reports (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  report_date DATE NOT NULL,
  work_summary TEXT NOT NULL,
  work_category VARCHAR(100),
  workers_count INTEGER DEFAULT 0,
  materials_used JSONB, -- [{material_id, material_name, quantity, unit}]
  photos JSONB, -- [s3_url1, s3_url2, ...]
  issues_faced TEXT,
  status report_status DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, report_date, supervisor_id)
);

-- Create indexes
CREATE INDEX idx_reports_site ON daily_reports(site_id);
CREATE INDEX idx_reports_supervisor ON daily_reports(supervisor_id);
CREATE INDEX idx_reports_date ON daily_reports(report_date);
CREATE INDEX idx_reports_status ON daily_reports(status);

-- Trigger for updated_at
CREATE TRIGGER update_daily_reports_updated_at
BEFORE UPDATE ON daily_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
