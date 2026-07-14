import FighterProfileScreen from "@/components/FighterProfileScreen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FighterProfileScreen fighterId={id} />;
}
