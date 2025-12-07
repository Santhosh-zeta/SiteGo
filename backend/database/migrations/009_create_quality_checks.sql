-- Create quality checks table for AI analysis results
CREATE TABLE IF NOT EXISTS quality_checks (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  report_id INTEGER REFERENCES daily_reports(id) ON DELETE SET NULL,
  issue_id INTEGER REFERENCES issues(id) ON DELETE SET NULL,
  defect_type VARCHAR(100) NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  description TEXT,
  image_url TEXT,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_quality_checks_site ON quality_checks(site_id);
CREATE INDEX idx_quality_checks_defect ON quality_checks(defect_type);
CREATE INDEX idx_quality_checks_severity ON quality_checks(severity);
CREATE INDEX idx_quality_checks_date ON quality_checks(analyzed_at);
CREATE INDEX idx_quality_checks_report ON quality_checks(report_id);
CREATE INDEX idx_quality_checks_issue ON quality_checks(issue_id);
