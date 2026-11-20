import { redirect } from "next/navigation";

export default async function LegacyRedirect({ params }) {
  const { id } = await params;
  redirect(`/aplikasi/${id}`);
}
