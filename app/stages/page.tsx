import { StageManagementTemplate } from "@/features/stage/components/templates/stage-management-template";
import { AdminWorkspaceLayout } from "@/shared/components/admin-workspace-layout";

export default function StagesPage() {
  return (
    <AdminWorkspaceLayout>
      <StageManagementTemplate mode="list" />
    </AdminWorkspaceLayout>
  );
}
