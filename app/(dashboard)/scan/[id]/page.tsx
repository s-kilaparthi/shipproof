import { redirect } from "next/navigation";

interface ScanDetailPageProps {
  params: { id: string };
}

export default function ScanDetailPage({ params }: ScanDetailPageProps) {
  redirect(`/scan/${params.id}/report`);
}
