-- Jalankan sekali di Neon SQL Editor (atau via psql) sebelum menjalankan aplikasi.

CREATE TABLE IF NOT EXISTS applications (
  id                 SERIAL PRIMARY KEY,
  app_id             TEXT UNIQUE NOT NULL,   -- contoh: 'APP-1042'
  app_name           TEXT,
  description        TEXT,
  status             TEXT,                   -- 'Available' | 'Request Access' | 'Retiring' | 'Pilot'
  department         TEXT,
  owner_unit         TEXT,
  po_number          TEXT,                   -- field lama, dipertahankan apa adanya
  programmer_name    TEXT,                   -- field lama, dipertahankan apa adanya
  product_owner      JSONB,                  -- { "name": "...", "position": "..." }
  assigned_employees JSONB DEFAULT '[]',      -- [{ "name": "...", "position": "..." }]
  modules            JSONB DEFAULT '[]',      -- ["Module 1", "Module 2"] ATAU string lama, ditangani di aplikasi
  diagram            TEXT,                   -- URL diagram, opsional
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_department ON applications (department);
