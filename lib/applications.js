import "server-only";
import { getSql } from "./db";

/**
 * Normalisasi modules baik berupa array, JSON string, atau string dipisah koma/baris baru.
 */
function normalizeModules(modules) {
  if (!modules) return [];
  if (Array.isArray(modules)) {
    return modules.map((m) => String(m).trim()).filter(Boolean);
  }
  if (typeof modules === "string") {
    const trimmed = modules.trim();
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeModules(parsed);
      } catch {
        // Bukan JSON valid, lanjut parsing string
      }
    }
    return trimmed
      .split(/\r?\n|,/)
      .map((m) => m.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Ambil data dasar aplikasi dengan JOIN ke lookup tables
 * (application_statuses, departments, owner_units)
 */
async function fetchAppBase(sql, whereClause = "", params = []) {
  const query = `
    SELECT
      a.id            AS internal_id,
      a.app_id,
      a.app_name,
      a.description,
      a.po_number,
      a.diagram,
      a.created_at,
      a.deleted_at,
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
 * Ambil semua modules untuk list app internal_id
 */
async function fetchModules(sql, appInternalIds) {
  if (!appInternalIds || appInternalIds.length === 0) return [];
  return sql(
    `SELECT app_id AS app_internal_id, module_name, description AS module_description
     FROM modules
     WHERE app_id = ANY($1::int[])
     ORDER BY id ASC`,
    [appInternalIds]
  );
}

/**
 * Ambil semua programmer/assignments untuk list app internal_id
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
 * Ambil product owner untuk list app internal_id
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

/**
 * Gabungkan baris-baris aplikasi yang memiliki app_name yang sama
 * agar tidak ada card duplikat di tampilan dan modul/programmer terkelompok dengan benar.
 */
function mergeApplicationGroup(rows, modulesByApp, assignmentsByApp, poByApp) {
  if (!rows || rows.length === 0) return null;

  const base = rows[0];

  let description = base.description ?? null;
  let status = base.status ?? null;
  let department = base.department ?? null;
  let owner_unit = base.owner_unit ?? null;
  let po_number = base.po_number ?? null;
  let diagram = base.diagram ?? null;
  let created_at = base.created_at ?? null;
  let deleted_at = base.deleted_at ?? null;

  const allModules = [];
  const seenModules = new Set();

  const allProgrammers = [];
  const seenProgrammers = new Set();

  const allPOs = [];
  const seenPOs = new Set();

  // Kelompokkan programmer berdasarkan modul yang dikerjakan pada baris masing-masing
  // Jika modulnya sama (atau pada baris yang sama), programmer1, programmer2 digabung di modul tersebut
  const moduleGroupsMap = new Map();

  for (const row of rows) {
    if (!description && row.description) description = row.description;
    if (!status && row.status) status = row.status;
    if (!department && row.department) department = row.department;
    if (!owner_unit && row.owner_unit) owner_unit = row.owner_unit;
    if (!po_number && row.po_number) po_number = row.po_number;
    if (!diagram && row.diagram) diagram = row.diagram;
    if (!created_at && row.created_at) created_at = row.created_at;
    if (!deleted_at && row.deleted_at) deleted_at = row.deleted_at;

    // Ambil data modul untuk baris ini
    const rawRowModules = modulesByApp.get(row.internal_id) || [];
    const rowModules = [];
    for (const m of rawRowModules) {
      if (!m || !m.module_name) continue;
      const normalized = normalizeModules(m.module_name);
      if (normalized.length > 0) {
        rowModules.push(...normalized);
      } else if (typeof m.module_name === "string" && m.module_name.trim()) {
        rowModules.push(m.module_name.trim());
      }
    }

    // Ambil data programmer untuk baris ini
    const rawRowAssignments = assignmentsByApp.get(row.internal_id) || [];
    const rowProgrammers = [];
    for (const a of rawRowAssignments) {
      if (!a || !a.employee_name) continue;
      const rawName = String(a.employee_name).trim();
      if (!rawName) continue;

      // Handle jika satu field berisi beberapa nama dipisah koma
      const names = rawName.includes(",")
        ? rawName.split(",").map((s) => s.trim()).filter(Boolean)
        : [rawName];

      for (const name of names) {
        rowProgrammers.push({
          name,
          position: a.assignment_role || a.employee_role || "Programmer",
        });
      }
    }

    // Ambil data product owner
    const rawRowPOs = poByApp.get(row.internal_id) || [];
    for (const po of rawRowPOs) {
      const name = po.employee_name ? String(po.employee_name).trim() : "";
      if (name && !seenPOs.has(name.toLowerCase())) {
        seenPOs.add(name.toLowerCase());
        allPOs.push({
          name,
          position: po.product_owner_label || po.employee_role || null,
        });
      }
    }

    // Kumpulkan seluruh modul unik
    for (const mod of rowModules) {
      const key = mod.toLowerCase();
      if (!seenModules.has(key)) {
        seenModules.add(key);
        allModules.push(mod);
      }
    }

    // Kumpulkan seluruh programmer unik
    for (const prog of rowProgrammers) {
      const key = prog.name.toLowerCase();
      if (!seenProgrammers.has(key)) {
        seenProgrammers.add(key);
        allProgrammers.push(prog);
      }
    }

    // Kelompokkan programmer & modul:
    // Jika kumpulan modulnya sama (atau pada baris yang sama), masukkan ke grup yang sama
    const moduleKey =
      rowModules.length > 0
        ? rowModules
            .map((m) => m.toLowerCase().trim())
            .sort()
            .join("|||")
        : `__no_modules_${row.internal_id}__`;

    if (!moduleGroupsMap.has(moduleKey)) {
      moduleGroupsMap.set(moduleKey, {
        modules: rowModules,
        programmers: [],
        seenProgrammersInGroup: new Set(),
      });
    }

    const group = moduleGroupsMap.get(moduleKey);
    if (group.modules.length === 0 && rowModules.length > 0) {
      group.modules = rowModules;
    }

    for (const prog of rowProgrammers) {
      const pKey = prog.name.toLowerCase();
      if (!group.seenProgrammersInGroup.has(pKey)) {
        group.seenProgrammersInGroup.add(pKey);
        group.programmers.push(prog);
      }
    }
  }

  const programmer_groups = [];
  for (const group of moduleGroupsMap.values()) {
    if (group.programmers.length > 0 || group.modules.length > 0) {
      programmer_groups.push({
        programmers: group.programmers,
        modules: group.modules,
      });
    }
  }

  const product_owner = allPOs.length > 0 ? allPOs[0] : null;
  const programmerNameStr = allProgrammers.map((p) => p.name).join(", ");

  return {
    internal_id: base.internal_id,
    id: base.app_id ? String(base.app_id).trim() : String(base.internal_id),
    app_id: base.app_id ? String(base.app_id).trim() : String(base.internal_id),
    app_name: base.app_name ?? null,
    description,
    status,
    department,
    owner_unit,
    po_number,
    product_owner,
    assigned_employees: allProgrammers,
    modules: allModules,
    programmer_groups,
    diagram,
    created_at,
    deleted_at,
    programmer_name: programmerNameStr,
    _legacy: {
      po_number,
      programmer_name: programmerNameStr,
    },
  };
}

/**
 * Helper pengelompok array of objects berdasarkan properti
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

// ─────────────────────────────────────────────────────────
// Public API Functions
// ─────────────────────────────────────────────────────────

export async function getAllApplications() {
  const sql = getSql();

  // 1. Ambil seluruh data aplikasi aktif (deleted_at IS NULL)
  const appRows = await fetchAppBase(sql, "WHERE a.deleted_at IS NULL", []);

  if (appRows.length === 0) return [];

  // 2. Kumpulkan semua internal_id untuk batch query relasi
  const allIds = appRows.map((r) => r.internal_id);

  // 3. Ambil data relasi (modules, assignments, product owners) secara paralel
  const [allModules, allAssignments, allProductOwners] = await Promise.all([
    fetchModules(sql, allIds),
    fetchAssignments(sql, allIds),
    fetchProductOwners(sql, allIds),
  ]);

  // 4. Kelompokkan relasi berdasarkan app_internal_id
  const modulesByApp = groupBy(allModules, "app_internal_id");
  const assignmentsByApp = groupBy(allAssignments, "app_internal_id");
  const poByApp = groupBy(allProductOwners, "app_internal_id");

  // 5. Kelompokkan baris applications berdasarkan app_name untuk MENGHAPUS DUPLIKAT
  const groups = new Map();

  for (const row of appRows) {
    const rawName = row.app_name ? String(row.app_name).trim() : "";
    const groupKey = rawName ? rawName.toLowerCase() : `__id_${row.app_id || row.internal_id}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(row);
  }

  // 6. Merge setiap grup menjadi 1 card aplikasi tunggal
  const result = [];
  for (const rowGroup of groups.values()) {
    const merged = mergeApplicationGroup(
      rowGroup,
      modulesByApp,
      assignmentsByApp,
      poByApp
    );
    if (merged) {
      result.push(merged);
    }
  }

  return result;
}

export async function getArchivedApplications() {
  const sql = getSql();

  // 1. Ambil seluruh data aplikasi yang di-soft delete (deleted_at IS NOT NULL)
  const appRows = await fetchAppBase(sql, "WHERE a.deleted_at IS NOT NULL", []);

  if (appRows.length === 0) return [];

  const allIds = appRows.map((r) => r.internal_id);

  const [allModules, allAssignments, allProductOwners] = await Promise.all([
    fetchModules(sql, allIds),
    fetchAssignments(sql, allIds),
    fetchProductOwners(sql, allIds),
  ]);

  const modulesByApp = groupBy(allModules, "app_internal_id");
  const assignmentsByApp = groupBy(allAssignments, "app_internal_id");
  const poByApp = groupBy(allProductOwners, "app_internal_id");

  const groups = new Map();

  for (const row of appRows) {
    const rawName = row.app_name ? String(row.app_name).trim() : "";
    const groupKey = rawName ? rawName.toLowerCase() : `__id_${row.app_id || row.internal_id}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(row);
  }

  const result = [];
  for (const rowGroup of groups.values()) {
    const merged = mergeApplicationGroup(
      rowGroup,
      modulesByApp,
      assignmentsByApp,
      poByApp
    );
    if (merged) {
      result.push(merged);
    }
  }

  return result;
}

export async function getApplicationById(id) {
  const sql = getSql();
  const trimmedId = String(id).trim();

  // 1. Cari baris target di applications berdasarkan app_id atau internal id
  const targetRows = await fetchAppBase(
    sql,
    "WHERE TRIM(a.app_id) = $1 OR a.id::text = $1",
    [trimmedId]
  );

  if (targetRows.length === 0) return null;
  const target = targetRows[0];

  let appRowsToMerge = [target];

  // 2. Jika baris memiliki app_name, cari SEMUA baris yang memiliki app_name yang sama
  //    agar data modul & programmer yang terpisah di database digabungkan
  if (target.app_name && String(target.app_name).trim()) {
    const appName = String(target.app_name).trim();
    const relatedRows = await fetchAppBase(
      sql,
      "WHERE TRIM(LOWER(a.app_name)) = TRIM(LOWER($1))",
      [appName]
    );

    if (relatedRows.length > 0) {
      const targetIndex = relatedRows.findIndex(
        (r) => r.internal_id === target.internal_id || r.app_id === target.app_id
      );
      const ordered = [...relatedRows];
      if (targetIndex > 0) {
        const [matched] = ordered.splice(targetIndex, 1);
        ordered.unshift(matched);
      }
      appRowsToMerge = ordered;
    }
  }

  // 3. Ambil data relasi (modules, assignments, product owners) untuk SEMUA baris terkait
  const allIds = appRowsToMerge.map((r) => r.internal_id);
  const [allModules, allAssignments, allProductOwners] = await Promise.all([
    fetchModules(sql, allIds),
    fetchAssignments(sql, allIds),
    fetchProductOwners(sql, allIds),
  ]);

  const modulesByApp = groupBy(allModules, "app_internal_id");
  const assignmentsByApp = groupBy(allAssignments, "app_internal_id");
  const poByApp = groupBy(allProductOwners, "app_internal_id");

  return mergeApplicationGroup(
    appRowsToMerge,
    modulesByApp,
    assignmentsByApp,
    poByApp
  );
}

export async function getDistinctDepartments() {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT d.name
    FROM departments d
    JOIN applications a ON a.department_id = d.id
    WHERE d.name IS NOT NULL AND a.deleted_at IS NULL
    ORDER BY d.name
  `;
  if (rows.length === 0) {
    const all = await sql`
      SELECT name FROM departments
      WHERE name IS NOT NULL
      ORDER BY name
    `;
    return all.map((r) => r.name).filter(Boolean);
  }
  return rows.map((r) => r.name).filter(Boolean);
}

export async function getDistinctStatuses() {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT s.status_name
    FROM application_statuses s
    JOIN applications a ON a.status_id = s.id
    WHERE s.status_name IS NOT NULL AND a.deleted_at IS NULL
    ORDER BY s.status_name
  `;
  if (rows.length === 0) {
    const all = await sql`
      SELECT status_name FROM application_statuses
      WHERE status_name IS NOT NULL
      ORDER BY status_name
    `;
    return all.map((r) => r.status_name).filter(Boolean);
  }
  return rows.map((r) => r.status_name).filter(Boolean);
}

// ─────────────────────────────────────────────────────────
// CRUD & Soft/Hard Delete Operations
// ─────────────────────────────────────────────────────────

export async function createApplication(data) {
  const sql = getSql();

  const app_name = data.app_name ? String(data.app_name).trim() : "Untitled Application";
  const description = data.description ? String(data.description).trim() : "";
  const po_number = data.po_number ? String(data.po_number).trim() : null;
  const diagram = data.diagram ? String(data.diagram).trim() : null;
  const rawAppId = data.app_id ? String(data.app_id).trim() : "";
  const appId = rawAppId || `APP-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Lookup / insert status
  let status_id = null;
  if (data.status && String(data.status).trim()) {
    const statusName = String(data.status).trim();
    const existing = await sql`SELECT id FROM application_statuses WHERE LOWER(status_name) = LOWER(${statusName}) LIMIT 1`;
    if (existing.length > 0) {
      status_id = existing[0].id;
    } else {
      const inserted = await sql`INSERT INTO application_statuses (status_name) VALUES (${statusName}) RETURNING id`;
      status_id = inserted[0].id;
    }
  }

  // 2. Lookup / insert department
  let department_id = null;
  if (data.department && String(data.department).trim()) {
    const deptName = String(data.department).trim();
    const existing = await sql`SELECT id FROM departments WHERE LOWER(name) = LOWER(${deptName}) LIMIT 1`;
    if (existing.length > 0) {
      department_id = existing[0].id;
    } else {
      const inserted = await sql`INSERT INTO departments (name) VALUES (${deptName}) RETURNING id`;
      department_id = inserted[0].id;
    }
  }

  // 3. Lookup / insert owner_unit
  let owner_unit_id = null;
  if (data.owner_unit && String(data.owner_unit).trim()) {
    const unitName = String(data.owner_unit).trim();
    const existing = await sql`SELECT id FROM owner_units WHERE LOWER(name) = LOWER(${unitName}) LIMIT 1`;
    if (existing.length > 0) {
      owner_unit_id = existing[0].id;
    } else {
      const inserted = await sql`INSERT INTO owner_units (name) VALUES (${unitName}) RETURNING id`;
      owner_unit_id = inserted[0].id;
    }
  }

  // 4. Insert main application row
  const newAppRows = await sql`
    INSERT INTO applications (
      app_id, app_name, description, status_id, department_id, owner_unit_id, po_number, diagram, created_at
    ) VALUES (
      ${appId}, ${app_name}, ${description}, ${status_id}, ${department_id}, ${owner_unit_id}, ${po_number}, ${diagram}, NOW()
    )
    RETURNING id, app_id
  `;
  const internalId = newAppRows[0].id;

  // 5. Insert modules
  const rawModules = normalizeModules(data.modules);
  for (const mod of rawModules) {
    if (mod) {
      await sql`
        INSERT INTO modules (app_id, module_name, description)
        VALUES (${internalId}, ${mod}, '')
      `;
    }
  }

  // 6. Insert assigned employees
  let programmers = [];
  if (Array.isArray(data.assigned_employees)) {
    programmers = data.assigned_employees;
  } else if (typeof data.programmer_name === "string" && data.programmer_name.trim()) {
    programmers = data.programmer_name.split(/[,;\n]/).map((n) => ({ name: n.trim(), position: "Programmer" })).filter((p) => p.name);
  }

  for (const prog of programmers) {
    const name = typeof prog === "string" ? prog.trim() : (prog?.name ? String(prog.name).trim() : "");
    const role = typeof prog === "object" && prog?.position ? String(prog.position).trim() : "Programmer";
    if (name) {
      let empId;
      const existingEmp = await sql`SELECT id FROM employees WHERE LOWER(name) = LOWER(${name}) LIMIT 1`;
      if (existingEmp.length > 0) {
        empId = existingEmp[0].id;
      } else {
        const empCode = "EMP-" + Math.floor(1000 + Math.random() * 9000);
        const newEmp = await sql`INSERT INTO employees (employee_code, name, role) VALUES (${empCode}, ${name}, ${role}) RETURNING id`;
        empId = newEmp[0].id;
      }
      await sql`
        INSERT INTO application_assignments (app_id, employee_id, assignment_role)
        VALUES (${internalId}, ${empId}, ${role})
      `;
    }
  }

  // 7. Insert product owner
  let poName = "";
  let poPos = "";
  if (data.product_owner) {
    if (typeof data.product_owner === "string") {
      poName = data.product_owner.trim();
    } else if (typeof data.product_owner === "object") {
      poName = data.product_owner.name ? String(data.product_owner.name).trim() : "";
      poPos = data.product_owner.position ? String(data.product_owner.position).trim() : "";
    }
  }

  if (poName) {
    let poEmpId;
    const existingPoEmp = await sql`SELECT id FROM employees WHERE LOWER(name) = LOWER(${poName}) LIMIT 1`;
    if (existingPoEmp.length > 0) {
      poEmpId = existingPoEmp[0].id;
    } else {
      const empCode = "EMP-" + Math.floor(1000 + Math.random() * 9000);
      const newEmp = await sql`INSERT INTO employees (employee_code, name, role) VALUES (${empCode}, ${poName}, ${poPos || "Product Owner"}) RETURNING id`;
      poEmpId = newEmp[0].id;
    }
    await sql`
      INSERT INTO application_product_owners (app_id, employee_id, product_owner)
      VALUES (${internalId}, ${poEmpId}, ${poPos || "Product Owner"})
    `;
  }

  return { id: appId, internal_id: internalId };
}

export async function updateApplication(id, data) {
  const sql = getSql();
  const trimmedId = String(id).trim();

  const targetRows = await sql`
    SELECT id, app_id FROM applications 
    WHERE TRIM(app_id) = ${trimmedId} OR id::text = ${trimmedId} 
    LIMIT 1
  `;
  if (targetRows.length === 0) {
    throw new Error("Application not found");
  }
  const internalId = targetRows[0].id;

  // Lookup / insert status
  let status_id = null;
  if (data.status && String(data.status).trim()) {
    const statusName = String(data.status).trim();
    const existing = await sql`SELECT id FROM application_statuses WHERE LOWER(status_name) = LOWER(${statusName}) LIMIT 1`;
    if (existing.length > 0) {
      status_id = existing[0].id;
    } else {
      const inserted = await sql`INSERT INTO application_statuses (status_name) VALUES (${statusName}) RETURNING id`;
      status_id = inserted[0].id;
    }
  }

  // Lookup / insert department
  let department_id = null;
  if (data.department && String(data.department).trim()) {
    const deptName = String(data.department).trim();
    const existing = await sql`SELECT id FROM departments WHERE LOWER(name) = LOWER(${deptName}) LIMIT 1`;
    if (existing.length > 0) {
      department_id = existing[0].id;
    } else {
      const inserted = await sql`INSERT INTO departments (name) VALUES (${deptName}) RETURNING id`;
      department_id = inserted[0].id;
    }
  }

  // Lookup / insert owner_unit
  let owner_unit_id = null;
  if (data.owner_unit && String(data.owner_unit).trim()) {
    const unitName = String(data.owner_unit).trim();
    const existing = await sql`SELECT id FROM owner_units WHERE LOWER(name) = LOWER(${unitName}) LIMIT 1`;
    if (existing.length > 0) {
      owner_unit_id = existing[0].id;
    } else {
      const inserted = await sql`INSERT INTO owner_units (name) VALUES (${unitName}) RETURNING id`;
      owner_unit_id = inserted[0].id;
    }
  }

  await sql`
    UPDATE applications
    SET 
      app_name = COALESCE(${data.app_name ?? null}, app_name),
      description = COALESCE(${data.description ?? null}, description),
      status_id = COALESCE(${status_id}, status_id),
      department_id = COALESCE(${department_id}, department_id),
      owner_unit_id = COALESCE(${owner_unit_id}, owner_unit_id),
      po_number = COALESCE(${data.po_number ?? null}, po_number),
      diagram = COALESCE(${data.diagram ?? null}, diagram)
    WHERE id = ${internalId}
  `;

  // Update modules if provided
  if (data.modules !== undefined) {
    await sql`DELETE FROM modules WHERE app_id = ${internalId}`;
    const rawModules = normalizeModules(data.modules);
    for (const mod of rawModules) {
      if (mod) {
        await sql`INSERT INTO modules (app_id, module_name, description) VALUES (${internalId}, ${mod}, '')`;
      }
    }
  }

  // Update assigned employees if provided
  if (data.assigned_employees !== undefined || data.programmer_name !== undefined) {
    await sql`DELETE FROM application_assignments WHERE app_id = ${internalId}`;
    let programmers = [];
    if (Array.isArray(data.assigned_employees)) {
      programmers = data.assigned_employees;
    } else if (typeof data.programmer_name === "string" && data.programmer_name.trim()) {
      programmers = data.programmer_name.split(/[,;\n]/).map((n) => ({ name: n.trim(), position: "Programmer" })).filter((p) => p.name);
    }
    for (const prog of programmers) {
      const name = typeof prog === "string" ? prog.trim() : (prog?.name ? String(prog.name).trim() : "");
      const role = typeof prog === "object" && prog?.position ? String(prog.position).trim() : "Programmer";
      if (name) {
        let empId;
        const existingEmp = await sql`SELECT id FROM employees WHERE LOWER(name) = LOWER(${name}) LIMIT 1`;
        if (existingEmp.length > 0) {
          empId = existingEmp[0].id;
        } else {
          const empCode = "EMP-" + Math.floor(1000 + Math.random() * 9000);
          const newEmp = await sql`INSERT INTO employees (employee_code, name, role) VALUES (${empCode}, ${name}, ${role}) RETURNING id`;
          empId = newEmp[0].id;
        }
        await sql`INSERT INTO application_assignments (app_id, employee_id, assignment_role) VALUES (${internalId}, ${empId}, ${role})`;
      }
    }
  }

  // Update product owner if provided
  if (data.product_owner !== undefined) {
    await sql`DELETE FROM application_product_owners WHERE app_id = ${internalId}`;
    let poName = "";
    let poPos = "";
    if (typeof data.product_owner === "string") {
      poName = data.product_owner.trim();
    } else if (typeof data.product_owner === "object" && data.product_owner) {
      poName = data.product_owner.name ? String(data.product_owner.name).trim() : "";
      poPos = data.product_owner.position ? String(data.product_owner.position).trim() : "";
    }
    if (poName) {
      let poEmpId;
      const existingPoEmp = await sql`SELECT id FROM employees WHERE LOWER(name) = LOWER(${poName}) LIMIT 1`;
      if (existingPoEmp.length > 0) {
        poEmpId = existingPoEmp[0].id;
      } else {
        const empCode = "EMP-" + Math.floor(1000 + Math.random() * 9000);
        const newEmp = await sql`INSERT INTO employees (employee_code, name, role) VALUES (${empCode}, ${poName}, ${poPos || "Product Owner"}) RETURNING id`;
        poEmpId = newEmp[0].id;
      }
      await sql`INSERT INTO application_product_owners (app_id, employee_id, product_owner) VALUES (${internalId}, ${poEmpId}, ${poPos || "Product Owner"})`;
    }
  }

  return { success: true, id: targetRows[0].app_id };
}

export async function softDeleteApplication(id) {
  const sql = getSql();
  const trimmedId = String(id).trim();
  const res = await sql`
    UPDATE applications
    SET deleted_at = NOW()
    WHERE TRIM(app_id) = ${trimmedId} OR id::text = ${trimmedId}
    RETURNING id, app_id
  `;
  if (res.length === 0) throw new Error("Application not found.");
  return res[0];
}

export async function restoreApplication(id) {
  const sql = getSql();
  const trimmedId = String(id).trim();
  const res = await sql`
    UPDATE applications
    SET deleted_at = NULL
    WHERE TRIM(app_id) = ${trimmedId} OR id::text = ${trimmedId}
    RETURNING id, app_id
  `;
  if (res.length === 0) throw new Error("Application not found.");
  return res[0];
}

export async function hardDeleteApplication(id) {
  const sql = getSql();
  const trimmedId = String(id).trim();
  const res = await sql`
    DELETE FROM applications
    WHERE TRIM(app_id) = ${trimmedId} OR id::text = ${trimmedId}
    RETURNING id, app_id
  `;
  if (res.length === 0) throw new Error("Application not found.");
  return res[0];
}
