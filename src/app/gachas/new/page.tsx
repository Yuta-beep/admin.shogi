import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";
import { GachaManagementTemplate } from "@/components/templates/gacha-management-template";

export default function NewGachaPage() {
  return (
    <AdminWorkspaceLayout>
      <GachaManagementTemplate mode="create" />
    </AdminWorkspaceLayout>
  );
}
