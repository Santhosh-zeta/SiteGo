-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  check_in_location JSONB NOT NULL, -- {lat, lng, address}
  check_out_location JSONB,
  is_valid BOOLEAN DEFAULT true,
  total_hours DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_site ON attendance(site_id);
CREATE INDEX idx_attendance_check_in ON attendance(check_in_time);
CREATE INDEX idx_attendance_date ON attendance(DATE(check_in_time));

-- Trigger to calculate total hours on checkout
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600.0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_calculate_hours
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION calculate_total_hours();

-- Trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
