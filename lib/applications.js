import "server-only";
import { getSql } from "./db";

// ─────────────────────────────────────────────────────────
// Helper: build the JSON shape the frontend expects from
// relational rows returned by the new normalised schema.
// ─────────────────────────────────────────────────────────

/**
 * Ambil data dasar aplikasi beserta lookup-table (status, department, owner_unit)
 * dalam satu query JOIN.
 * Mengembalikan satu baris per aplikasi.
 */
async function fetchAppBase(sql, whereClause, params) {
  // whereClause sudah berisi placeholder yang sesuai dengan `params`
  const query = `
    SELECT
      a.id            AS internal_id,
      a.app_id,
      a.app_name,
      a.description,
      a.po_number,
      a.diagram,
      a.created_at,
      s.status_name   AS status,
      d.name          AS department,
      ou.name         AS owner_unit
    FROM applications a
    LEFT JOIN application_statuses s  ON s.id = a.status_id
    LEFT JOIN departments d           ON d.id = a.department_id
    LEFT JOIN owner_units ou          ON ou.id = a.owner_unit_id
    ${whereClause}
    ORDER BY a.created_at DESC NULLS LAST, a.id ASC
  `;
  return sql(query, params);
}

/**
 * Ambil semua modul untuk satu atau lebih app internal id.
 * Mengembalikan baris-baris { app_internal_id, module_name, module_description }.
 */
async function fetchModules(sql, appInternalIds) {
  if (!appInternalIds || appInternalIds.length === 0) return [];
  // Gunakan ANY($1::int[]) agar hanya satu placeholder
  return sql(
    `SELECT app_id AS app_internal_id, module_name, description AS module_description
     FROM modules
     WHERE app_id = ANY($1::int[])
     ORDER BY id ASC`,
    [appInternalIds]
  );
}

/**
 * Ambil semua assignment (programmer) untuk satu atau lebih app internal id.
 * Mengembalikan baris-baris { app_internal_id, employee_name, employee_role, assignment_role }.
 */
async function fetchAssignments(sql, appInternalIds) {
  if (!appInternalIds || appInternalIds.length === 0) return [];
  return sql(
    `SELECT
       aa.app_id          AS app_internal_id,
       e.name             AS employee_name,
       e.role             AS employee_role,
       aa.assignment_role
     FROM application_assignments aa
     JOIN employees e ON e.id = aa.employee_id
     WHERE aa.app_id = ANY($1::int[])
     ORDER BY aa.id ASC`,
    [appInternalIds]
  );
}

/**
 * Ambil product owner untuk satu atau lebih app internal id.
 * Mengembalikan baris-baris { app_internal_id, employee_name, employee_role, product_owner_label }.
 */
async function fetchProductOwners(sql, appInternalIds) {
  if (!appInternalIds || appInternalIds.length === 0) return [];
  return sql(
    `SELECT
       apo.app_id          AS app_internal_id,
       e.name              AS employee_name,
       e.role              AS employee_role,
       apo.product_owner   AS product_owner_label
     FROM application_product_owners apo
     JOIN employees e ON e.id = apo.employee_id
     WHERE apo.app_id = ANY($1::int[])
     ORDER BY apo.id ASC`,
    [appInternalIds]
  );
}

// ─────────────────────────────────────────────────────────
// Compose: satukan data relasional menjadi objek JSON
// yang 100% kompatibel dengan format lama.
// ─────────────────────────────────────────────────────────

/**
 * Dari satu baris aplikasi + data terkait, bangun objek tunggal
 * berformat sama persis dengan JSON lama.
 */
function composeApplicationView(appRow, modules, assignments, productOwners) {
  // -- modules: array of string --
  const moduleNames = modules.map((m) => m.module_name);

  // -- assigned_employees: array of { name, position } --
  const assignedEmployees = assignments.map((a) => ({
    name: a.employee_name,
    position: a.assignment_role || a.employee_role || "Programmer",
  }));

  // -- product_owner: { name, position } | null --
  let productOwner = null;
  if (productOwners.length > 0) {
    const po = productOwners[0];
    productOwner = {
      name: po.employee_name ?? null,
      position: po.product_owner_label || po.employee_role || null,
    };
  }

  // -- programmer_groups --
  // Setiap programmer mendapat satu group entry dengan semua modul aplikasi,
  // karena skema relasional baru tidak memiliki relasi langsung programmer↔modul.
  // Jika ada banyak programmer, kita tetap buat satu group yang berisi
  // semua programmer beserta seluruh modul.
  const programmer_groups = [];
  if (assignedEmployees.length > 0 || moduleNames.length > 0) {
    programmer_groups.push({
      programmers: assignedEmployees,
      modules: moduleNames,
    });
  }

  const programmerNameStr = assignedEmployees.map((e) => e.name).join(", ");

  return {
    id: appRow.app_id ? String(appRow.app_id).trim() : String(appRow.internal_id),
    app_name: appRow.app_name ?? null,
    description: appRow.description ?? null,
    status: appRow.status ?? null,
    department: appRow.department ?? null,
    owner_unit: appRow.owner_unit ?? null,
    po_number: appRow.po_number ?? null,
    product_owner: productOwner,
    assigned_employees: assignedEmployees,
    modules: moduleNames,
    programmer_groups,
    diagram: appRow.diagram ?? null,
    created_at: appRow.created_at ?? null,
    programmer_name: programmerNameStr,
    _legacy: {
      po_number: appRow.po_number ?? null,
      programmer_name: programmerNameStr,
    },
  };
}

// ─────────────────────────────────────────────────────────
// Public API — fungsi yang dipanggil oleh page / route
// ─────────────────────────────────────────────────────────

export async function getAllApplications() {
  const sql = getSql();

  // 1. Ambil semua aplikasi + lookup JOIN
  const appRows = await fetchAppBase(sql, "", []);

  if (appRows.length === 0) return [];

  // 2. Kumpulkan semua internal_id
  const allIds = appRows.map((r) => r.internal_id);

  // 3. Ambil data relasional secara paralel
  const [allModules, allAssignments, allProductOwners] = await Promise.all([
    fetchModules(sql, allIds),
    fetchAssignments(sql, allIds),
    fetchProductOwners(sql, allIds),
  ]);

  // 4. Kelompokkan berdasarkan app internal_id
  const modulesByApp = groupBy(allModules, "app_internal_id");
  const assignmentsByApp = groupBy(allAssignments, "app_internal_id");
  const poByApp = groupBy(allProductOwners, "app_internal_id");

  // 5. Compose setiap aplikasi
  return appRows.map((row) =>
    composeApplicationView(
      row,
      modulesByApp.get(row.internal_id) || [],
      assignmentsByApp.get(row.internal_id) || [],
      poByApp.get(row.internal_id) || []
    )
  );
}

export async function getApplicationById(id) {
  const sql = getSql();
  const trimmedId = String(id).trim();

  // Cari berdasarkan app_id (teks, misal "APP-1042") ATAU internal id (angka)
  const appRows = await fetchAppBase(
    sql,
    "WHERE TRIM(a.app_id) = $1 OR a.id::text = $1",
    [trimmedId]
  );

  if (appRows.length === 0) return null;

  const app = appRows[0];
  const appId = app.internal_id;

  // Ambil data relasional secara paralel
  const [modules, assignments, productOwners] = await Promise.all([
    fetchModules(sql, [appId]),
    fetchAssignments(sql, [appId]),
    fetchProductOwners(sql, [appId]),
  ]);

  return composeApplicationView(app, modules, assignments, productOwners);
}

export async function getDistinctDepartments() {
  const sql = getSql();
  const rows = await sql`
    SELECT name FROM departments
    ORDER BY name
  `;
  return rows.map((r) => r.name).filter(Boolean);
}

export async function getDistinctStatuses() {
  const sql = getSql();
  const rows = await sql`
    SELECT status_name FROM application_statuses
    ORDER BY status_name
  `;
  return rows.map((r) => r.status_name).filter(Boolean);
}

// ─────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────

/**
 * Kelompokkan array of objects berdasarkan key tertentu.
 * Mengembalikan Map<keyValue, rows[]>.
 */
function groupBy(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return map;
}
