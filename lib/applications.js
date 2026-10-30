import "server-only";
import { getSql } from "./db";

/**
 * Ubah field `modules` yang bisa berupa array (JSONB) ATAU string lama
 * ("Frontend, Backend, Authentication" / dipisah newline / koma) menjadi array bersih.
 * Tidak pernah melempar error dan tidak mengubah data asli di database.
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
        // Bukan JSON valid, lanjutkan ke pemisahan teks biasa
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
 * Ekstrak nama programmer dari field `programmer_name` atau `assigned_employees`
 * (string tunggal, string dipisah koma/newline, array, atau JSON).
 */
function extractProgrammers(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return { name: item.trim(), position: "Programmer" };
        if (typeof item === "object" && item.name) {
          return {
            name: String(item.name).trim(),
            position: item.position ? String(item.position).trim() : "Programmer",
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractProgrammers(parsed);
      } catch {
        // Bukan JSON valid, lanjutkan pemisahan teks
      }
    }
    return trimmed
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, position: "Programmer" }));
  }
  if (typeof val === "object" && val.name) {
    return [
      {
        name: String(val.name).trim(),
        position: val.position ? String(val.position).trim() : "Programmer",
      },
    ];
  }
  return [];
}

/**
 * Dapatkan daftar programmer dari satu baris database.
 * Memprioritaskan field `programmer_name`, dengan fallback ke `assigned_employees`.
 */
function getRowProgrammers(row) {
  const fromProgrammer = extractProgrammers(row.programmer_name);
  if (fromProgrammer.length > 0) {
    return fromProgrammer;
  }
  if (row.assigned_employees) {
    return extractProgrammers(row.assigned_employees);
  }
  return [];
}

/**
 * Gabungkan baris-baris aplikasi yang memiliki app_name yang sama.
 * Menggabungkan modul dan programmer sesuai relasinya pada baris database.
 */
function mergeApplicationRows(rows) {
  if (!rows || rows.length === 0) return null;

  const base = rows[0];

  const allModules = [];
  const seenModules = new Set();

  const allProgrammers = [];
  const seenProgrammers = new Set();

  let description = base.description ?? null;
  let status = base.status ?? null;
  let department = base.department ?? null;
  let owner_unit = base.owner_unit ?? null;
  let po_number = base.po_number ?? null;
  let product_owner = base.product_owner ?? null;
  let diagram = base.diagram ?? null;
  let created_at = base.created_at ?? null;

  // Kelompokkan programmer berdasarkan modul yang dikerjakan
  // Jika modulnya sama pada database maka programmer1, programmer2 digabung di modul tersebut
  const moduleGroupsMap = new Map();

  for (const row of rows) {
    if (!description && row.description) description = row.description;
    if (!status && row.status) status = row.status;
    if (!department && row.department) department = row.department;
    if (!owner_unit && row.owner_unit) owner_unit = row.owner_unit;
    if (!po_number && row.po_number) po_number = row.po_number;
    if (!product_owner && row.product_owner) product_owner = row.product_owner;
    if (!diagram && row.diagram) diagram = row.diagram;
    if (!created_at && row.created_at) created_at = row.created_at;

    // Kumpulkan modul keseluruhan tanpa duplikat
    const rowModules = normalizeModules(row.modules);
    for (const mod of rowModules) {
      const key = mod.toLowerCase();
      if (!seenModules.has(key)) {
        seenModules.add(key);
        allModules.push(mod);
      }
    }

    // Kumpulkan programmer keseluruhan tanpa duplikat
    const rowProgrammers = getRowProgrammers(row);
    for (const prog of rowProgrammers) {
      const key = prog.name.toLowerCase();
      if (!seenProgrammers.has(key)) {
        seenProgrammers.add(key);
        allProgrammers.push(prog);
      }
    }

    // Kelompokkan berdasarkan kumpulan modul pada baris database
    const moduleKey =
      rowModules.length > 0
        ? rowModules
            .map((m) => m.toLowerCase().trim())
            .sort()
            .join("|||")
        : `__no_modules_${row.id || row.app_id || Math.random()}__`;

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

  return {
    id: typeof base.app_id === "string" ? base.app_id.trim() : (base.app_id ?? String(base.id)),
    app_name: base.app_name ?? null,
    description,
    status,
    department,
    owner_unit,
    po_number,
    product_owner: product_owner
      ? {
          name: product_owner.name ?? null,
          position: product_owner.position ?? null,
        }
      : null,
    assigned_employees: allProgrammers,
    modules: allModules,
    programmer_groups,
    diagram,
    created_at,
    programmer_name: allProgrammers.map((p) => p.name).join(", "),
    _legacy: {
      po_number: po_number ?? base.po_number ?? null,
      programmer_name: allProgrammers.map((p) => p.name).join(", "),
    },
  };
}

export async function getAllApplications() {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM applications
    ORDER BY created_at DESC NULLS LAST
  `;

  // Kelompokkan baris berdasarkan app_name yang sama
  const groups = new Map();

  for (const row of rows) {
    const rawName = row.app_name ? String(row.app_name).trim() : "";
    const groupKey = rawName ? rawName.toLowerCase() : `__id_${row.app_id || row.id}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(row);
  }

  const result = [];
  for (const rowGroup of groups.values()) {
    const merged = mergeApplicationRows(rowGroup);
    if (merged) {
      result.push(merged);
    }
  }

  return result;
}

export async function getApplicationById(id) {
  const sql = getSql();
  const trimmedId = String(id).trim();

  // 1. Cari baris target berdasarkan app_id atau id
  const targetRows = await sql`
    SELECT * FROM applications
    WHERE TRIM(app_id) = ${trimmedId}
       OR id::text = ${trimmedId}
    LIMIT 1
  `;

  if (targetRows.length === 0) return null;
  const target = targetRows[0];

  // 2. Jika baris memiliki app_name, ambil semua baris yang memiliki app_name yang sama
  //    lalu gabungkan seluruh modul dan programmer_name-nya
  if (target.app_name && String(target.app_name).trim()) {
    const appName = String(target.app_name).trim();
    const relatedRows = await sql`
      SELECT * FROM applications
      WHERE TRIM(LOWER(app_name)) = TRIM(LOWER(${appName}))
      ORDER BY created_at DESC NULLS LAST, id ASC
    `;

    if (relatedRows.length > 0) {
      // Pastikan target row berada di urutan pertama sebagai data acuan utama
      const targetIndex = relatedRows.findIndex(
        (r) =>
          (target.id != null && r.id != null && r.id === target.id) ||
          (target.app_id != null && r.app_id != null && r.app_id === target.app_id)
      );

      const orderedRows = [...relatedRows];
      if (targetIndex > 0) {
        const [matchedTarget] = orderedRows.splice(targetIndex, 1);
        orderedRows.unshift(matchedTarget);
      } else if (targetIndex === -1) {
        orderedRows.unshift(target);
      }

      return mergeApplicationRows(orderedRows);
    }
  }

  return mergeApplicationRows([target]);
}

export async function getDistinctDepartments() {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT department FROM applications
    WHERE department IS NOT NULL
    ORDER BY department
  `;
  return rows.map((r) => r.department).filter(Boolean);
}

export async function getDistinctStatuses() {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT status FROM applications
    WHERE status IS NOT NULL
    ORDER BY status
  `;
  return rows.map((r) => r.status).filter(Boolean);
}
