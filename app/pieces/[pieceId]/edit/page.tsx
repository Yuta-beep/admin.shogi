import { PieceManagementTemplate } from "@/features/piece/components/templates/piece-management-template";
import { AdminWorkspaceLayout } from "@/shared/components/admin-workspace-layout";

type Props = {
  params: {
    pieceId: string;
  };
};

export default function EditPiecePage({ params }: Props) {
  const pieceId = Number(params.pieceId);

  return (
    <AdminWorkspaceLayout>
      <PieceManagementTemplate
        mode="edit"
        pieceId={Number.isInteger(pieceId) ? pieceId : undefined}
      />
    </AdminWorkspaceLayout>
  );
}
