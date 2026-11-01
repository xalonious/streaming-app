import PlayerPage from "@/components/screens/PlayerPage";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{type: string}> }) {
  if ((await params).type !== "tv") redirect("/");
  return <PlayerPage />;
}
