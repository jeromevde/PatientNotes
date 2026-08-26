// Shows the transcript sentence a note was taken from, so the practitioner can check the model.

export function Quote({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="mt-1.5 border-l-2 border-line pl-3 text-[13px] leading-snug text-muted">
      « {text} »
    </p>
  );
}
