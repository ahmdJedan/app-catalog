-- ============================================================
-- Skema relasional untuk Application Catalog
-- Migrasi dari tabel tunggal `applications_old` ke 8 tabel.
-- Jalankan sekali di Neon SQL Editor (atau via psql).
-- ============================================================

-- Lookup tables
CREATE TABLE IF NOT EXISTS application_statuses (
  id           INTEGER PRIMARY KEY DEFAULT (floor(random() * 2000000000 + 1)),
  status_name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS departments (
  id    INTEGER PRIMARY KEY DEFAULT (floor(random() * 2000000000 + 1)),
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS owner_units (
  id    INTEGER PRIMARY KEY DEFAULT (floor(random() * 2000000000 + 1)),
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS employees (
  id             INTEGER PRIMARY KEY DEFAULT (floor(random() * 2000000000 + 1)),
  employee_code  TEXT DEFAULT ('EMP-' || upper(substr(md5(random()::text), 1, 6))) UNIQUE,
  name           TEXT NOT NULL UNIQUE,
  role           TEXT
);

-- Main applications table
CREATE TABLE IF NOT EXISTS applications (
  id              INTEGER PRIMARY KEY DEFAULT (floor(random() * 2000000000 + 1)),
  app_id          TEXT NOT NULL UNIQUE DEFAULT ('APP-' || upper(substr(md5(random()::text), 1, 8))),
  app_name        TEXT,
  description     TEXT,
  status_id       INTEGER REFERENCES application_statuses(id) ON DELETE SET NULL,
  department_id   INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  owner_unit_id   INTEGER REFERENCES owner_units(id) ON DELETE SET NULL,
  po_number       TEXT,
  diagram         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Junction / detail tables
CREATE TABLE IF NOT EXISTS modules (
  id           INTEGER PRIMARY KEY DEFAULT (floor(random() * 2000000000 + 1)),
  app_id       INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  module_name  TEXT NOT NULL,
  description  TEXT
);

CREATE TABLE IF NOT EXISTS application_assignments (
  id               INTEGER PRIMARY KEY DEFAULT (floor(random() * 2000000000 + 1)),
  app_id           INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  employee_id      INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  assignment_role  TEXT
);

CREATE TABLE IF NOT EXISTS application_product_owners (
  id              INTEGER PRIMARY KEY DEFAULT (floor(random() * 2000000000 + 1)),
  app_id          INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  employee_id     INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  product_owner   TEXT
);
