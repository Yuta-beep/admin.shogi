import { StageManagementTemplate } from "@/components/templates/stage-management-template";
import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";

export default function StagesPage() {
  return (
    <AdminWorkspaceLayout>
      <StageManagementTemplate mode="list" />
    </AdminWorkspaceLayout>
  );
}
