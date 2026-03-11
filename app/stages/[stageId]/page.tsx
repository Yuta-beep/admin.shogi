import { StageDetailTemplate } from "@/features/stage/components/templates/stage-detail-template";
import { AdminWorkspaceLayout } from "@/shared/components/admin-workspace-layout";

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
