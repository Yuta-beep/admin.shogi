import { PieceManagementTemplate } from "@/features/piece/components/templates/piece-management-template";
import { AdminWorkspaceLayout } from "@/shared/components/admin-workspace-layout";

export default function NewPiecePage() {
  return (
    <AdminWorkspaceLayout>
      <PieceManagementTemplate mode="create" />
    </AdminWorkspaceLayout>
  );
}
