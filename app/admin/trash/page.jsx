import { checkAdminSession } from "@/lib/auth";
import { getTrashApplications } from "@/lib/applications";
import { redirect } from "next/navigation";
import AdminNavbar from "@/components/AdminNavbar";
import Footer from "@/components/Footer";
import AdminTrashView from "@/components/AdminTrashView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tempat Sampah Aplikasi - Admin Panel | DSTI UNDIP",
};

export default async function AdminTrashPage() {
  const session = await checkAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const trashList = await getTrashApplications();

  return (
    <div className="admin-page-container">
      <AdminNavbar trashCount={trashList.length} />

      <main className="container main-content">
        <AdminTrashView initialTrash={trashList} />
      </main>

      <Footer />
    </div>
  );
}
