import { StageDetailTemplate } from "@/components/templates/stage-detail-template";
import { AdminWorkspaceLayout } from "@/components/layout/admin-workspace-layout";

type Props = {
  params: {
    stageId: string;
  };
};

export default function StageDetailPage({ params }: Props) {
  const stageId = Number(params.stageId);

  return (
    <AdminWorkspaceLayout>
      <StageDetailTemplate stageId={Number.isInteger(stageId) ? stageId : 0} />
    </AdminWorkspaceLayout>
  );
}
