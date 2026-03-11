import { PieceManagementTemplate } from "@/components/templates/piece-management-template";
import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";

export default function NewPiecePage() {
  return (
    <AdminWorkspaceLayout>
      <PieceManagementTemplate mode="create" />
    </AdminWorkspaceLayout>
  );
}
