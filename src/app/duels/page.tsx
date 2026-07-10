import type { Metadata } from "next";
import DuelsPageClient from "./DuelsPageClient";

export const metadata: Metadata = {
  title: "Friend Duels — SolveX",
  description: "Invite-only 1v1 friend duels. Same problem, judged on a shared custom test — first to pass wins.",
};

export default function DuelsPage() {
  return <DuelsPageClient />;
}
