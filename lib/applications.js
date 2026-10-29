import "server-only";
import { getSql } from "./db";

/**
 * Ubah field `modules` yang bisa berupa array (JSONB) ATAU string lama
 * ("Frontend, Backend, Authentication" / dipisah newline) menjadi array bersih.
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
        // Bukan JSON valid, lanjutkan ke pemisahan teks
      }
    }
    return trimmed
      .split(/\r?\n|,/)
      .map((m) => m.trim())
      .filter(Boolean);
  }
  return [];
}

function extractProgrammerNames(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return item.trim();
        if (typeof item === "object" && item.name) return String(item.name).trim();
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
        return extractProgrammerNames(parsed);
      } catch {
        // Bukan JSON valid, lanjutkan pemisahan teks
      }
    }
    return trimmed
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof val === "object" && val.name) {
    const name = String(val.name).trim();
    return name ? [name] : [];
  }
  return [];
}

/**
 * Dapatkan daftar programmer dari satu baris database.
 * Memprioritaskan field `programmer_name`, dengan fallback ke `assigned_employees`.
 */
function getRowProgrammers(row) {
  const fromProgrammer = extractProgrammerNames(row.programmer_name);
  if (fromProgrammer.length > 0) {
    return fromProgrammer;
  }
  if (row.assigned_employees) {
    return extractProgrammerNames(row.assigned_employees);
  }
  return [];
}

/**
 * Gabungkan baris-baris aplikasi yang memiliki app_name yang sama.
 * Menggabungkan seluruh modul dan seluruh programmer_name ke assigned_employees tanpa duplikat.
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
  let product_owner = base.product_owner ?? null;
  let diagram = base.diagram ?? null;
  let created_at = base.created_at ?? null;

  for (const row of rows) {
    if (!description && row.description) description = row.description;
    if (!status && row.status) status = row.status;
    if (!department && row.department) department = row.department;
    if (!owner_unit && row.owner_unit) owner_unit = row.owner_unit;
    if (!product_owner && row.product_owner) product_owner = row.product_owner;
    if (!diagram && row.diagram) diagram = row.diagram;
    if (!created_at && row.created_at) created_at = row.created_at;

    // Gabungkan modules tanpa duplikat
    const rowModules = normalizeModules(row.modules);
    for (const mod of rowModules) {
      const key = mod.toLowerCase();
      if (!seenModules.has(key)) {
        seenModules.add(key);
        allModules.push(mod);
      }
    }

    // Gabungkan programmer_name ke assigned_employees tanpa duplikat
    const rowProgrammers = getRowProgrammers(row);
    for (const prog of rowProgrammers) {
      const key = prog.toLowerCase();
      if (!seenProgrammers.has(key)) {
        seenProgrammers.add(key);
        allProgrammers.push({
          name: prog,
          position: "Programmer",
        });
      }
    }
  }

  return {
    id: typeof base.app_id === "string" ? base.app_id.trim() : (base.app_id ?? String(base.id)),
    app_name: base.app_name ?? null,
    description,
    status,
    department,
    owner_unit,
    product_owner: product_owner
      ? {
          name: product_owner.name ?? null,
          position: product_owner.position ?? null,
        }
      : null,
    // Menggunakan data programmer_name yang sudah digabung
    assigned_employees: allProgrammers,
    // Modules yang sudah digabung
    modules: allModules,
    diagram,
    created_at,
    _legacy: {
      po_number: base.po_number ?? null,
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

  // Kelompokkan row berdasarkan app_name yang sama
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
  //    lalu gabungkan modul dan programmer_name-nya
  if (target.app_name && String(target.app_name).trim()) {
    const appName = String(target.app_name).trim();
    const relatedRows = await sql`
      SELECT * FROM applications
      WHERE TRIM(LOWER(app_name)) = TRIM(LOWER(${appName}))
      ORDER BY created_at DESC NULLS LAST
    `;

    // Pastikan target berada di urutan pertama sebagai data basis
    const combined = [
      target,
      ...relatedRows.filter((r) => r.id !== target.id && r.app_id !== target.app_id),
    ];

    return mergeApplicationRows(combined);
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
