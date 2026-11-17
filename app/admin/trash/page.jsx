import { getArchivedApplications } from "@/lib/applications";
import TrashApplicationsTable from "../components/TrashApplicationsTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tempat Sampah (Trash) - Admin Panel",
};

export default async function AdminTrashPage() {
  let archivedApps = [];

  try {
    archivedApps = await getArchivedApplications();
  } catch (error) {
    console.error("[AdminTrashPage]", error);
  }

  return <TrashApplicationsTable archivedApplications={archivedApps} />;
}
