
import CompetitionDetailClient from "./CompetitionDetailClient";

export default async function Page({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  return <CompetitionDetailClient leagueId={leagueId} />;
}
