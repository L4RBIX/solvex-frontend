import type { Metadata } from "next";
import DuelRoomClient from "./DuelRoomClient";

export const metadata: Metadata = {
  title: "Duel Room — SolveX",
  description: "Live friend duel waiting room: ready up, countdown, and enter the Arena together.",
};

export default async function DuelRoomPage({
  params,
}: {
  params: Promise<{ duelId: string }>;
}) {
  const { duelId } = await params;
  return <DuelRoomClient duelId={duelId} />;
}
