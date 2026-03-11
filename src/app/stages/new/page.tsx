import { StageManagementTemplate } from "@/components/templates/stage-management-template";
import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";

export default function NewStagePage() {
  return (
    <AdminWorkspaceLayout>
      <StageManagementTemplate mode="create" />
    </AdminWorkspaceLayout>
  );
}
