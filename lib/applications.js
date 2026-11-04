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
    id: base.app_id ? String(base.app_id).trim() : String(base.internal_id),
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

  // 1. Ambil seluruh data aplikasi dari tabel applications + lookup tables
  const appRows = await fetchAppBase(sql, "", []);

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
    WHERE d.name IS NOT NULL
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
    WHERE s.status_name IS NOT NULL
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
