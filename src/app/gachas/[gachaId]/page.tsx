import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";
import { GachaDetailTemplate } from "@/components/templates/gacha-detail-template";

type Props = {
  params: {
    gachaId: string;
  };
};

export default function GachaDetailPage({ params }: Props) {
  const gachaId = Number(params.gachaId);

  return (
    <AdminWorkspaceLayout>
      <GachaDetailTemplate gachaId={Number.isInteger(gachaId) ? gachaId : 0} />
    </AdminWorkspaceLayout>
  );
}
