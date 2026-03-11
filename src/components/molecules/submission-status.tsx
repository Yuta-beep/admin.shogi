"use client";

type Props = {
  isSubmitting: boolean;
  isCompleted: boolean;
  submittingText: string;
  completedText?: string;
  centered?: boolean;
};

export function SubmissionStatus({
  isSubmitting,
  isCompleted,
  submittingText,
  completedText = "完了",
  centered = false,
}: Props) {
  if (!isSubmitting && !isCompleted) return null;

  if (isSubmitting) {
    if (centered) {
      return (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-md border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
              <span>{submittingText}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
          <span>{submittingText}</span>
        </div>
      </div>
    );
  }

  if (centered) {
    return (
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-lg">
          {completedText}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {completedText}
    </div>
  );
}
