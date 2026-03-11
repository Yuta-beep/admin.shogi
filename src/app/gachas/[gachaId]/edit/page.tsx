import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";
import { GachaManagementTemplate } from "@/components/templates/gacha-management-template";

type Props = {
  params: {
    gachaId: string;
  };
};

export default function EditGachaPage({ params }: Props) {
  const gachaId = Number(params.gachaId);

  return (
    <AdminWorkspaceLayout>
      <GachaManagementTemplate
        mode="edit"
        gachaId={Number.isInteger(gachaId) ? gachaId : undefined}
      />
    </AdminWorkspaceLayout>
  );
}
