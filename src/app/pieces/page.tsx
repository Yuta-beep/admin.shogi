import { PieceManagementTemplate } from "@/components/templates/piece-management-template";
import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";

export default function PiecesPage() {
  return (
    <AdminWorkspaceLayout>
      <PieceManagementTemplate mode="list" />
    </AdminWorkspaceLayout>
  );
}
