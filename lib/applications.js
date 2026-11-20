import "server-only";
import { getSql } from "./db.js";

/**
 * Helper untuk menentukan URL publik aplikasi berdasarkan data yang ada
 */
export function derivePublicUrl(row) {
  if (row.diagram && row.diagram.startsWith("http") && !row.diagram.includes("diagram")) {
    return row.diagram;
  }
  
  // Jika po_number / nama aplikasi memiliki layanan publik standar
  const name = (row.app_name || "").toLowerCase().trim();
  const po = (row.po_number || "").toUpperCase().trim();

  // Aplikasi internal yang eksplisit internal
  if (name.includes("host to host") || name.includes("siasat-inov") || po === "BKAP" || po === "DIRINOV") {
    return null;
  }

  // Aplikasi yang biasanya memiliki portal publik di undip
  const slug = name.replace(/[^a-z0-9]/g, "");
  if (slug) {
    return `https://${slug}.undip.ac.id`;
  }
  return null;
}

/**
 * Format 1 baris aplikasi untuk tampilan list/grid/table
 */
function toListView(row) {
  const publicUrl = derivePublicUrl(row);
  return {
    id: row.id,
    app_id: row.app_id ? String(row.app_id).trim() : String(row.id),
    app_name: row.app_name || "Aplikasi Tanpa Nama",
    description: row.description || "Deskripsi belum tersedia.",
    status: row.status || "Aktif",
    status_id: row.status_id,
    department: row.department || "Direktorat Sistem dan Teknologi Informasi",
    department_id: row.department_id,
    owner_unit: row.owner_unit || row.po_number || "DSTI",
    owner_unit_id: row.owner_unit_id,
    po_number: row.po_number || "",
    diagram: row.diagram || null,
    public_url: publicUrl,
    developer_count: Number(row.developer_count || 0),
    module_count: Number(row.module_count || 0),
    created_at: row.created_at,
    deleted_at: row.deleted_at,
  };
}

/**
 * Ambil semua aplikasi aktif (deleted_at IS NULL), dideduplikasi berdasarkan nama aplikasi
 */
export async function getAllApplications({ includeDeleted = false, search = "", department = "", status = "" } = {}) {
  const sql = getSql();

  const [rows, allAssignments, allModules] = await Promise.all([
    sql`
      SELECT 
        a.id,
        a.app_id,
        a.app_name,
        a.description,
        a.po_number,
        a.diagram,
        a.created_at,
        a.deleted_at,
        a.status_id,
        a.department_id,
        a.owner_unit_id,
        COALESCE(s.status_name, 'Aktif') as status,
        d.name as department,
        o.name as owner_unit
      FROM applications a
      LEFT JOIN application_statuses s ON a.status_id = s.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN owner_units o ON a.owner_unit_id = o.id
      WHERE (${includeDeleted} = true OR a.deleted_at IS NULL)
      ORDER BY a.created_at DESC NULLS LAST, a.id DESC
    `,
    sql`
      SELECT 
        aa.app_id,
        e.name as employee_name,
        e.role as employee_role,
        e.employee_code,
        aa.assignment_role
      FROM application_assignments aa
      LEFT JOIN employees e ON aa.employee_id = e.id
    `,
    sql`
      SELECT id, app_id, module_name, description
      FROM modules
    `,
  ]);

  // Buat indeks pemetaan assignments & modules berdasarkan app_id (row id)
  const assignmentsByAppId = new Map();
  for (const a of allAssignments) {
    if (!assignmentsByAppId.has(a.app_id)) {
      assignmentsByAppId.set(a.app_id, []);
    }
    assignmentsByAppId.get(a.app_id).push(a);
  }

  const modulesByAppId = new Map();
  for (const m of allModules) {
    if (!modulesByAppId.has(m.app_id)) {
      modulesByAppId.set(m.app_id, []);
    }
    modulesByAppId.get(m.app_id).push(m);
  }

  // Kelompokkan aplikasi berdasarkan nama aplikasi (case-insensitive & trim)
  const groupMap = new Map();
  for (const row of rows) {
    const rawName = (row.app_name || "").trim();
    const key = rawName ? rawName.toLowerCase() : `id_${row.id}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key).push(row);
  }

  const unifiedList = [];
  for (const group of groupMap.values()) {
    // Pilih row representatif terbaik (prioritas: deskripsi tidak kosong, lalu ID terlama/kanonikal)
    const primary = group.reduce((best, curr) => {
      if (!best) return curr;
      const currHasDesc = Boolean(curr.description && curr.description.trim());
      const bestHasDesc = Boolean(best.description && best.description.trim());
      if (currHasDesc && !bestHasDesc) return curr;
      if (!currHasDesc && bestHasDesc) return best;
      return curr.id < best.id ? curr : best;
    });

    const description =
      primary.description ||
      group.find((r) => r.description && r.description.trim())?.description ||
      "Deskripsi belum tersedia.";
    const diagram =
      primary.diagram ||
      group.find((r) => r.diagram && r.diagram.trim())?.diagram ||
      null;
    const po_number =
      primary.po_number ||
      group.find((r) => r.po_number && r.po_number.trim())?.po_number ||
      "";

    // Kumpulkan seluruh programmer unik yang terlibat di seluruh baris aplikasi ini
    const employeeMap = new Map();
    for (const r of group) {
      const ass = assignmentsByAppId.get(r.id) || [];
      for (const a of ass) {
        const empName = a.employee_name || "";
        if (empName) {
          const k = empName.toLowerCase().trim();
          if (!employeeMap.has(k)) {
            employeeMap.set(k, {
              name: empName,
              role: a.assignment_role || a.employee_role || "Programmer",
              code: a.employee_code,
            });
          }
        }
      }
    }
    const assignedEmployees = Array.from(employeeMap.values());

    // Kumpulkan seluruh modul unik dari seluruh baris aplikasi ini
    const moduleMap = new Map();
    for (const r of group) {
      const mods = modulesByAppId.get(r.id) || [];
      for (const m of mods) {
        const mName = (m.module_name || "").trim();
        if (mName) {
          const k = mName.toLowerCase();
          if (!moduleMap.has(k)) {
            moduleMap.set(k, mName);
          }
        }
      }
    }
    const uniqueModules = Array.from(moduleMap.values());

    // Format tampilan list
    const appItem = toListView({
      ...primary,
      description,
      diagram,
      po_number,
      developer_count: assignedEmployees.length,
      module_count: uniqueModules.length,
    });

    appItem.assigned_employees = assignedEmployees;
    appItem.modules = uniqueModules;
    appItem.sibling_ids = group.map((r) => r.id);

    unifiedList.push(appItem);
  }

  let result = unifiedList;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (app) =>
        app.app_name.toLowerCase().includes(q) ||
        (app.description && app.description.toLowerCase().includes(q)) ||
        (app.department && app.department.toLowerCase().includes(q)) ||
        (app.owner_unit && app.owner_unit.toLowerCase().includes(q)) ||
        (app.po_number && app.po_number.toLowerCase().includes(q)) ||
        app.assigned_employees?.some((dev) => dev.name && dev.name.toLowerCase().includes(q)) ||
        app.modules?.some((mod) => (typeof mod === "string" ? mod : mod.name)?.toLowerCase().includes(q))
    );
  }

  if (department && department !== "Semua Direktorat") {
    result = result.filter((app) => app.department === department);
  }

  if (status && status !== "Semua Status") {
    result = result.filter((app) => app.status === status);
  }

  return result;
}

/**
 * Ambil aplikasi di tempat sampah (deleted_at IS NOT NULL), dideduplikasi berdasarkan nama aplikasi
 */
export async function getTrashApplications() {
  const sql = getSql();

  const [rows, allAssignments, allModules] = await Promise.all([
    sql`
      SELECT 
        a.id,
        a.app_id,
        a.app_name,
        a.description,
        a.po_number,
        a.diagram,
        a.created_at,
        a.deleted_at,
        a.status_id,
        a.department_id,
        a.owner_unit_id,
        COALESCE(s.status_name, 'Aktif') as status,
        d.name as department,
        o.name as owner_unit
      FROM applications a
      LEFT JOIN application_statuses s ON a.status_id = s.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN owner_units o ON a.owner_unit_id = o.id
      WHERE a.deleted_at IS NOT NULL
      ORDER BY a.deleted_at DESC
    `,
    sql`
      SELECT 
        aa.app_id,
        e.name as employee_name,
        e.role as employee_role,
        e.employee_code,
        aa.assignment_role
      FROM application_assignments aa
      LEFT JOIN employees e ON aa.employee_id = e.id
    `,
    sql`
      SELECT id, app_id, module_name, description
      FROM modules
    `,
  ]);

  const assignmentsByAppId = new Map();
  for (const a of allAssignments) {
    if (!assignmentsByAppId.has(a.app_id)) {
      assignmentsByAppId.set(a.app_id, []);
    }
    assignmentsByAppId.get(a.app_id).push(a);
  }

  const modulesByAppId = new Map();
  for (const m of allModules) {
    if (!modulesByAppId.has(m.app_id)) {
      modulesByAppId.set(m.app_id, []);
    }
    modulesByAppId.get(m.app_id).push(m);
  }

  const groupMap = new Map();
  for (const row of rows) {
    const rawName = (row.app_name || "").trim();
    const key = rawName ? rawName.toLowerCase() : `id_${row.id}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key).push(row);
  }

  const list = [];
  for (const group of groupMap.values()) {
    const primary = group[0];
    const employeeMap = new Map();
    for (const r of group) {
      const ass = assignmentsByAppId.get(r.id) || [];
      for (const a of ass) {
        const empName = a.employee_name || "";
        if (empName) {
          const k = empName.toLowerCase().trim();
          if (!employeeMap.has(k)) {
            employeeMap.set(k, {
              name: empName,
              role: a.assignment_role || a.employee_role || "Programmer",
              code: a.employee_code,
            });
          }
        }
      }
    }

    const moduleMap = new Map();
    for (const r of group) {
      const mods = modulesByAppId.get(r.id) || [];
      for (const m of mods) {
        const mName = (m.module_name || "").trim();
        if (mName) {
          const k = mName.toLowerCase();
          if (!moduleMap.has(k)) {
            moduleMap.set(k, mName);
          }
        }
      }
    }

    const appItem = toListView({
      ...primary,
      developer_count: employeeMap.size,
      module_count: moduleMap.size,
    });
    appItem.assigned_employees = Array.from(employeeMap.values());
    appItem.modules = Array.from(moduleMap.values());
    appItem.sibling_ids = group.map((r) => r.id);
    list.push(appItem);
  }

  return list;
}

/**
 * Ambil detail lengkap 1 aplikasi berdasarkan id serial atau app_id
 * Menggabungkan seluruh data kontributor & modul dari entri yang memiliki app_name sama.
 */
export async function getApplicationById(id) {
  const sql = getSql();
  const trimmedId = String(id).trim();

  const rows = await sql`
    SELECT 
      a.id,
      a.app_id,
      a.app_name,
      a.description,
      a.po_number,
      a.diagram,
      a.created_at,
      a.deleted_at,
      a.status_id,
      a.department_id,
      a.owner_unit_id,
      COALESCE(s.status_name, 'Aktif') as status,
      d.name as department,
      o.name as owner_unit
    FROM applications a
    LEFT JOIN application_statuses s ON a.status_id = s.id
    LEFT JOIN departments d ON a.department_id = d.id
    LEFT JOIN owner_units o ON a.owner_unit_id = o.id
    WHERE a.app_id = ${trimmedId}
       OR a.id::text = ${trimmedId}
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const primaryApp = rows[0];
  const appName = (primaryApp.app_name || "").trim();

  // Temukan seluruh baris dengan nama aplikasi yang sama
  let allSiblingRows = [primaryApp];
  if (appName) {
    const siblings = await sql`
      SELECT 
        a.id,
        a.app_id,
        a.app_name,
        a.description,
        a.po_number,
        a.diagram,
        a.created_at,
        a.deleted_at,
        a.status_id,
        a.department_id,
        a.owner_unit_id,
        COALESCE(s.status_name, 'Aktif') as status,
        d.name as department,
        o.name as owner_unit
      FROM applications a
      LEFT JOIN application_statuses s ON a.status_id = s.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN owner_units o ON a.owner_unit_id = o.id
      WHERE LOWER(TRIM(a.app_name)) = LOWER(${appName})
        AND a.deleted_at IS NULL
      ORDER BY a.id ASC
    `;
    if (siblings.length > 0) {
      allSiblingRows = siblings;
    }
  }

  const allAppIds = Array.from(new Set(allSiblingRows.map((r) => Number(r.id))));

  // Ambil pengembang / assignment dari seluruh sibling rows
  const assignments = await sql`
    SELECT 
      aa.id,
      aa.app_id,
      aa.assignment_role,
      e.id as employee_id,
      e.name as employee_name,
      e.role as employee_role,
      e.employee_code
    FROM application_assignments aa
    LEFT JOIN employees e ON aa.employee_id = e.id
    WHERE aa.app_id = ANY(${allAppIds})
    ORDER BY aa.id ASC
  `;

  // Pemetaan programmer per baris app_id dan daftar unik pengembang
  const programmersByAppId = new Map();
  const employeeMap = new Map();

  for (const a of assignments) {
    const pName = a.employee_name || "Pengembang";
    if (!programmersByAppId.has(a.app_id)) {
      programmersByAppId.set(a.app_id, []);
    }
    if (!programmersByAppId.get(a.app_id).includes(pName)) {
      programmersByAppId.get(a.app_id).push(pName);
    }

    const key = pName.toLowerCase().trim();
    if (!employeeMap.has(key)) {
      employeeMap.set(key, {
        name: pName,
        role: a.assignment_role || a.employee_role || "Programmer",
        code: a.employee_code,
      });
    }
  }

  const assignedEmployees = Array.from(employeeMap.values());

  // Ambil product owner
  const pos = await sql`
    SELECT 
      apo.id,
      apo.product_owner,
      e.id as employee_id,
      e.name as employee_name,
      e.role as employee_role
    FROM application_product_owners apo
    LEFT JOIN employees e ON apo.employee_id = e.id
    WHERE apo.app_id = ANY(${allAppIds})
    ORDER BY apo.id ASC
  `;

  // Ambil modules dari seluruh sibling rows
  const mods = await sql`
    SELECT id, app_id, module_name, description
    FROM modules
    WHERE app_id = ANY(${allAppIds})
    ORDER BY id ASC
  `;

  // Petakan modul dengan programmer penanggung jawab
  const moduleMap = new Map();
  for (const m of mods) {
    const mName = (m.module_name || "").trim();
    if (!mName) continue;
    const normKey = mName.toLowerCase();

    // Cari programmer untuk modul ini berdasarkan row asalnya di database
    const devsForThisRow = programmersByAppId.get(m.app_id) || [];
    const devName =
      devsForThisRow.length > 0
        ? devsForThisRow.join(", ")
        : assignedEmployees[0]?.name || "Tim Pengembang DSTI";

    if (moduleMap.has(normKey)) {
      const existing = moduleMap.get(normKey);
      if (!existing.programmer.includes(devName) && devName !== "Tim Pengembang DSTI") {
        existing.programmer = `${existing.programmer}, ${devName}`;
      }
    } else {
      moduleMap.set(normKey, {
        id: m.id,
        name: mName,
        programmer: devName,
        description: m.description || "",
      });
    }
  }

  const modulesList = Array.from(moduleMap.values());

  // Field fallback jika primary kosong
  const description =
    primaryApp.description ||
    allSiblingRows.find((r) => r.description && r.description.trim())?.description ||
    "";
  const diagram =
    primaryApp.diagram ||
    allSiblingRows.find((r) => r.diagram && r.diagram.trim())?.diagram ||
    "";
  const poNumber =
    primaryApp.po_number ||
    allSiblingRows.find((r) => r.po_number && r.po_number.trim())?.po_number ||
    "";

  const publicUrl = derivePublicUrl({
    ...primaryApp,
    diagram,
    po_number: poNumber,
  });

  return {
    id: primaryApp.id,
    app_id: primaryApp.app_id ? String(primaryApp.app_id).trim() : String(primaryApp.id),
    app_name: primaryApp.app_name || "Aplikasi Tanpa Nama",
    description: description,
    status: primaryApp.status || "Aktif",
    status_id: primaryApp.status_id,
    department: primaryApp.department || "",
    department_id: primaryApp.department_id,
    owner_unit: primaryApp.owner_unit || "",
    owner_unit_id: primaryApp.owner_unit_id,
    po_number: poNumber,
    diagram: diagram,
    public_url: publicUrl,
    created_at: primaryApp.created_at,
    deleted_at: primaryApp.deleted_at,
    product_owner:
      pos.length > 0
        ? {
            name: pos[0].employee_name || pos[0].product_owner || "",
            position: pos[0].employee_role || pos[0].product_owner || "Product Owner",
          }
        : null,
    assigned_employees: assignedEmployees,
    modules: modulesList,
    modules_detailed: modulesList,
  };
}

/**
 * Ambil statistik aplikasi untuk Dashboard Admin dan Hero
 */
export async function getApplicationStats() {
  const sql = getSql();

  const [totalRes, activeRes, trashRes, deptRes] = await Promise.all([
    sql`SELECT count(DISTINCT LOWER(TRIM(app_name)))::int as count FROM applications WHERE deleted_at IS NULL`,
    sql`
      SELECT count(DISTINCT LOWER(TRIM(a.app_name)))::int as count 
      FROM applications a
      LEFT JOIN application_statuses s ON a.status_id = s.id
      WHERE a.deleted_at IS NULL AND (s.status_name = 'Aktif' OR a.status_id IS NULL)
    `,
    sql`SELECT count(DISTINCT LOWER(TRIM(app_name)))::int as count FROM applications WHERE deleted_at IS NOT NULL`,
    sql`SELECT count(DISTINCT department_id)::int as count FROM applications WHERE deleted_at IS NULL`,
  ]);

  const total = totalRes[0]?.count || 0;
  const active = activeRes[0]?.count || 0;
  const trash = trashRes[0]?.count || 0;
  const depts = deptRes[0]?.count || 0;

  // Estimasi publik: aplikasi aktif yang bukan internal-only
  const publicAccess = Math.max(0, Math.round(active * 0.65));

  return {
    totalApplications: total,
    activeApplications: active,
    publicAccess: publicAccess,
    trashApplications: trash,
    totalDepartments: depts,
  };
}

/**
 * Ambil daftar nama departemen unik
 */
export async function getDistinctDepartments() {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT d.name
    FROM departments d
    JOIN applications a ON a.department_id = d.id
    WHERE a.deleted_at IS NULL AND d.name IS NOT NULL
    ORDER BY d.name
  `;
  return rows.map((r) => r.name).filter(Boolean);
}

/**
 * Ambil daftar nama status unik
 */
export async function getDistinctStatuses() {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT status_name FROM application_statuses ORDER BY status_name
  `;
  const list = rows.map((r) => r.status_name).filter(Boolean);
  return list.length > 0 ? list : ["Aktif", "Tidak Aktif"];
}

/**
 * Soft delete aplikasi (set deleted_at = NOW())
 * Menghapus seluruh baris entri yang terkait dengan aplikasi ini.
 */
export async function softDeleteApplication(id) {
  const sql = getSql();
  const trimmed = String(id).trim();

  const existing = await sql`
    SELECT id, app_id, app_name FROM applications 
    WHERE (id::text = ${trimmed} OR app_id = ${trimmed})
    LIMIT 1
  `;
  if (existing.length === 0) return null;

  const appName = existing[0].app_name ? existing[0].app_name.trim() : null;

  let result;
  if (appName) {
    result = await sql`
      UPDATE applications
      SET deleted_at = NOW()
      WHERE LOWER(TRIM(app_name)) = LOWER(${appName})
        AND deleted_at IS NULL
      RETURNING id, app_id, app_name
    `;
  } else {
    result = await sql`
      UPDATE applications
      SET deleted_at = NOW()
      WHERE (id::text = ${trimmed} OR app_id = ${trimmed})
        AND deleted_at IS NULL
      RETURNING id, app_id, app_name
    `;
  }

  return result[0] || null;
}

/**
 * Restore aplikasi dari tempat sampah (set deleted_at = NULL)
 * Memulihkan seluruh baris entri yang terkait dengan aplikasi ini.
 */
export async function restoreApplication(id) {
  const sql = getSql();
  const trimmed = String(id).trim();

  const existing = await sql`
    SELECT id, app_id, app_name FROM applications 
    WHERE (id::text = ${trimmed} OR app_id = ${trimmed})
    LIMIT 1
  `;
  if (existing.length === 0) return null;

  const appName = existing[0].app_name ? existing[0].app_name.trim() : null;

  let result;
  if (appName) {
    result = await sql`
      UPDATE applications
      SET deleted_at = NULL
      WHERE LOWER(TRIM(app_name)) = LOWER(${appName})
        AND deleted_at IS NOT NULL
      RETURNING id, app_id, app_name
    `;
  } else {
    result = await sql`
      UPDATE applications
      SET deleted_at = NULL
      WHERE (id::text = ${trimmed} OR app_id = ${trimmed})
        AND deleted_at IS NOT NULL
      RETURNING id, app_id, app_name
    `;
  }

  return result[0] || null;
}

/**
 * Tambah aplikasi baru ke database
 */
export async function createApplication(data) {
  const sql = getSql();

  const appId = (data.app_id || "").trim() || `APP-${Date.now().toString().slice(-4)}`;
  const appName = (data.app_name || "").trim();
  const description = (data.description || "").trim();
  const poNumber = (data.po_number || "").trim();
  const diagram = (data.diagram || "").trim() || null;

  // Resolve status_id
  let statusId = null;
  if (data.status) {
    const sRows = await sql`SELECT id FROM application_statuses WHERE status_name = ${data.status} LIMIT 1`;
    if (sRows.length > 0) statusId = sRows[0].id;
  }
  if (!statusId) {
    const sDef = await sql`SELECT id FROM application_statuses WHERE status_name = 'Aktif' LIMIT 1`;
    statusId = sDef[0]?.id || 1106226295;
  }

  // Resolve department_id
  let deptId = null;
  if (data.department) {
    const dRows = await sql`SELECT id FROM departments WHERE name = ${data.department.trim()} LIMIT 1`;
    if (dRows.length > 0) deptId = dRows[0].id;
  }

  // Resolve owner_unit_id
  let unitId = null;
  if (data.owner_unit) {
    const uRows = await sql`SELECT id FROM owner_units WHERE name = ${data.owner_unit.trim()} LIMIT 1`;
    if (uRows.length > 0) unitId = uRows[0].id;
  }

  // Insert application
  const appRes = await sql`
    INSERT INTO applications (
      app_id, app_name, description, status_id, department_id, owner_unit_id,
      po_number, diagram, created_at, deleted_at
    ) VALUES (
      ${appId}, ${appName}, ${description}, ${statusId}, ${deptId}, ${unitId},
      ${poNumber}, ${diagram}, NOW(), NULL
    )
    RETURNING id, app_id, app_name
  `;

  const newApp = appRes[0];
  const newAppId = newApp.id;

  // Insert modules if any
  if (Array.isArray(data.modules) && data.modules.length > 0) {
    for (const mod of data.modules) {
      const modName = typeof mod === "string" ? mod.trim() : mod?.name?.trim();
      if (modName) {
        await sql`
          INSERT INTO modules (app_id, module_name, description)
          VALUES (${newAppId}, ${modName}, ${description})
        `;
      }
    }
  }

  // Insert assignments if any
  if (Array.isArray(data.assigned_employees) && data.assigned_employees.length > 0) {
    for (const emp of data.assigned_employees) {
      const empName = emp?.name?.trim();
      const empRole = emp?.role?.trim() || "Programmer";
      if (empName) {
        // Cari / pakai employee
        const empRows = await sql`SELECT id FROM employees WHERE name = ${empName} LIMIT 1`;
        let empId = empRows[0]?.id;
        if (!empId) {
          const empInsert = await sql`
            INSERT INTO employees (employee_code, name, role)
            VALUES (${`EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`}, ${empName}, ${empRole})
            RETURNING id
          `;
          empId = empInsert[0]?.id;
        }

        if (empId) {
          await sql`
            INSERT INTO application_assignments (app_id, employee_id, assignment_role)
            VALUES (${newAppId}, ${empId}, ${empRole})
          `;
        }
      }
    }
  }

  return newApp;
}

/**
 * Update aplikasi
 */
export async function updateApplication(id, data) {
  const sql = getSql();
  const trimmed = String(id).trim();

  // Pastikan aplikasi ada
  const existing = await sql`
    SELECT id FROM applications
    WHERE id::text = ${trimmed} OR app_id = ${trimmed}
    LIMIT 1
  `;
  if (existing.length === 0) return null;
  const appId = existing[0].id;

  const appName = (data.app_name || "").trim();
  const description = (data.description || "").trim();
  const poNumber = (data.po_number || "").trim();
  const diagram = (data.diagram || "").trim() || null;

  // Resolve status_id
  let statusId = null;
  if (data.status) {
    const sRows = await sql`SELECT id FROM application_statuses WHERE status_name = ${data.status} LIMIT 1`;
    if (sRows.length > 0) statusId = sRows[0].id;
  }

  // Resolve department_id
  let deptId = null;
  if (data.department) {
    const dRows = await sql`SELECT id FROM departments WHERE name = ${data.department.trim()} LIMIT 1`;
    if (dRows.length > 0) deptId = dRows[0].id;
  }

  // Resolve owner_unit_id
  let unitId = null;
  if (data.owner_unit) {
    const uRows = await sql`SELECT id FROM owner_units WHERE name = ${data.owner_unit.trim()} LIMIT 1`;
    if (uRows.length > 0) unitId = uRows[0].id;
  }

  await sql`
    UPDATE applications
    SET 
      app_name = ${appName},
      description = ${description},
      po_number = ${poNumber},
      diagram = ${diagram},
      status_id = COALESCE(${statusId}, status_id),
      department_id = COALESCE(${deptId}, department_id),
      owner_unit_id = COALESCE(${unitId}, owner_unit_id)
    WHERE id = ${appId}
  `;

  // Update modules jika diberikan
  if (Array.isArray(data.modules)) {
    await sql`DELETE FROM modules WHERE app_id = ${appId}`;
    for (const mod of data.modules) {
      const modName = typeof mod === "string" ? mod.trim() : mod?.name?.trim();
      if (modName) {
        await sql`
          INSERT INTO modules (app_id, module_name, description)
          VALUES (${appId}, ${modName}, ${description})
        `;
      }
    }
  }

  // Update assignments jika diberikan
  if (Array.isArray(data.assigned_employees)) {
    await sql`DELETE FROM application_assignments WHERE app_id = ${appId}`;
    for (const emp of data.assigned_employees) {
      const empName = emp?.name?.trim();
      const empRole = emp?.role?.trim() || "Programmer";
      if (empName) {
        const empRows = await sql`SELECT id FROM employees WHERE name = ${empName} LIMIT 1`;
        let empId = empRows[0]?.id;
        if (!empId) {
          const empInsert = await sql`
            INSERT INTO employees (employee_code, name, role)
            VALUES (${`EMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`}, ${empName}, ${empRole})
            RETURNING id
          `;
          empId = empInsert[0]?.id;
        }

        if (empId) {
          await sql`
            INSERT INTO application_assignments (app_id, employee_id, assignment_role)
            VALUES (${appId}, ${empId}, ${empRole})
          `;
        }
      }
    }
  }

  return { id: appId, app_name: appName };
}
