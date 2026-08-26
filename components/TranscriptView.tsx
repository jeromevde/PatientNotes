"use client";

// Editable transcript with quotes painted on a layer behind the textarea.
// The field itself is still plain text. If a quote is edited away, the mark goes.

import { useEffect, useRef, type ReactNode } from "react";
import { paintSegments, quoteAt } from "@/lib/quotes";
import { scrollIfNeeded } from "@/lib/scroll";

const surface =
  "absolute inset-0 overflow-y-scroll px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap";

export function TranscriptView({
  transcript,
  onChange,
  quotes,
  activeQuote,
  once = false,
  onPickQuote,
}: {
  transcript: string;
  onChange: (value: string) => void;
  quotes: string[];
  activeQuote: string | null;
  once?: boolean;
  onPickQuote: (quote: string) => void;
}) {
  const back = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const focusMark = useRef<HTMLElement | null>(null);
  const segments = paintSegments(transcript, quotes, activeQuote, once);
  const quoteKey = quotes.join("\0");

  function syncScroll() {
    if (!back.current || !area.current) return;
    back.current.scrollTop = area.current.scrollTop;
    back.current.scrollLeft = area.current.scrollLeft;
  }

  useEffect(() => {
    const mark = focusMark.current;
    const pane = area.current;
    if (!mark || !pane || !activeQuote) return;
    syncScroll();
    scrollIfNeeded(mark, pane);
  }, [transcript, activeQuote, quoteKey]);

  const parts: ReactNode[] = [];
  let placedFocus = false;
  for (const [i, seg] of segments.entries()) {
    if (seg.kind === "plain") {
      parts.push(<span key={i}>{seg.text}</span>);
      continue;
    }
    const isActive = seg.kind === "active";
    parts.push(
      <mark
        key={i}
        ref={
          isActive && !placedFocus
            ? (el) => {
                focusMark.current = el;
              }
            : undefined
        }
        className={
          isActive
            ? "quote-paint bg-mark-on text-card"
            : "quote-paint bg-mark text-ink"
        }
      >
        {seg.text}
      </mark>,
    );
    if (isActive) placedFocus = true;
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={back}
        aria-hidden
        className={`${surface} pointer-events-none text-ink`}
      >
        {parts}
        {"\n"}
      </div>
      <textarea
        ref={area}
        value={transcript}
        aria-label="Transcript"
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onClick={(e) => {
          const el = e.currentTarget;
          if (el.selectionStart !== el.selectionEnd) return;
          const q = quoteAt(transcript, quotes, el.selectionStart, once);
          if (q) onPickQuote(q);
        }}
        spellCheck={false}
        className={`${surface} resize-none bg-transparent text-transparent caret-ink outline-none`}
      />
    </div>
  );
}
