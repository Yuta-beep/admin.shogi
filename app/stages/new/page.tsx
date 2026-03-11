import { StageManagementTemplate } from "@/features/stage/components/templates/stage-management-template";
import { AdminWorkspaceLayout } from "@/shared/components/admin-workspace-layout";

export default function NewStagePage() {
  return (
    <AdminWorkspaceLayout>
      <StageManagementTemplate mode="create" />
    </AdminWorkspaceLayout>
  );
}
