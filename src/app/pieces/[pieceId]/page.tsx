import { PieceDetailTemplate } from "@/components/templates/piece-detail-template";
import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";

type Props = {
  params: {
    pieceId: string;
  };
};

export default function PieceDetailPage({ params }: Props) {
  const pieceId = Number(params.pieceId);

  return (
    <AdminWorkspaceLayout>
      <PieceDetailTemplate pieceId={Number.isInteger(pieceId) ? pieceId : 0} />
    </AdminWorkspaceLayout>
  );
}
