// Find quotes in the transcript and decide which ones to paint for the active tab.
// A quote that is not an exact slice of the transcript is dropped.
// Complements paint the product name (first mention), not the surrounding sentence.

import { productById } from "./data";
import type { Claim, ConsultationNotes } from "./types";

export type NoteTab = "motif" | "anamnese" | "complements" | "hygiene" | "suivi";

export function foundInTranscript(
  transcript: string,
  quote: string | null,
): boolean {
  if (!quote) return false;
  const q = quote.trim();
  return q.length > 0 && transcript.includes(q);
}

export function keepVerbatimQuotes(
  transcript: string,
  notes: ConsultationNotes,
): ConsultationNotes {
  const keep = (quote: string | null) =>
    foundInTranscript(transcript, quote) ? quote : null;
  const keepClaims = (claims: Claim[]): Claim[] =>
    claims.map((c) => ({ ...c, quote: keep(c.quote) }));
  return {
    ...notes,
    motif: keepClaims(notes.motif),
    anamnese: keepClaims(notes.anamnese),
    hygiene_de_vie: keepClaims(notes.hygiene_de_vie),
    suivi: keepClaims(notes.suivi),
    complements: notes.complements.map((c) => ({
      ...c,
      quote: keep(c.quote),
    })),
  };
}

function claimQuotes(claims: Claim[]): string[] {
  return claims.map((c) => c.quote).filter((q): q is string => Boolean(q));
}

function firstIgnoreCase(hay: string, needle: string): string | null {
  const q = needle.trim();
  if (q.length < 3) return null;
  const i = hay.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return null;
  return hay.slice(i, i + q.length);
}

/** Longest prefix of the catalog name that appears in the transcript. */
export function complementHighlight(
  transcript: string,
  produit_id: string,
): string | null {
  const product = productById(produit_id);
  if (!product) return null;
  const exact = firstIgnoreCase(transcript, product.nom);
  if (exact) return exact;
  const parts = product.nom.trim().split(/[\s+/]+/).filter(Boolean);
  for (let n = parts.length - 1; n >= 1; n--) {
    const hit = firstIgnoreCase(transcript, parts.slice(0, n).join(" "));
    if (hit) return hit;
  }
  return null;
}

export function quotesForTab(
  notes: ConsultationNotes,
  tab: NoteTab,
  transcript: string,
): string[] {
  if (tab === "complements") {
    return notes.complements
      .map((c) => complementHighlight(transcript, c.produit_id))
      .filter((q): q is string => Boolean(q));
  }
  if (tab === "motif") return claimQuotes(notes.motif);
  if (tab === "anamnese") return claimQuotes(notes.anamnese);
  if (tab === "hygiene") return claimQuotes(notes.hygiene_de_vie);
  return claimQuotes(notes.suivi);
}

export type PaintKind = "plain" | "quote" | "active";

export function paintSegments(
  transcript: string,
  quotes: string[],
  activeQuote: string | null,
  once = false,
): { text: string; kind: PaintKind; quote: string | null }[] {
  const ranges: { start: number; end: number; active: boolean }[] = [];
  const active = activeQuote?.trim() ?? "";
  for (const quote of quotes) {
    const q = quote.trim();
    if (!q) continue;
    let from = 0;
    while (from < transcript.length) {
      const i = transcript.indexOf(q, from);
      if (i < 0) break;
      ranges.push({ start: i, end: i + q.length, active: q === active });
      if (once) break;
      from = i + q.length;
    }
  }
  const cuts = new Set<number>([0, transcript.length]);
  for (const r of ranges) {
    cuts.add(r.start);
    cuts.add(r.end);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const segs: { text: string; kind: PaintKind; quote: string | null }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (start === end) continue;
    const covering = ranges.filter((r) => r.start <= start && r.end >= end);
    let kind: PaintKind = "plain";
    if (covering.some((r) => r.active)) kind = "active";
    else if (covering.length > 0) kind = "quote";
    let quote: string | null = null;
    if (covering.length > 0) {
      covering.sort((a, b) => b.end - b.start - (a.end - a.start));
      quote = transcript.slice(covering[0].start, covering[0].end);
    }
    segs.push({ text: transcript.slice(start, end), kind, quote });
  }
  return segs;
}

export function quoteAt(
  transcript: string,
  quotes: string[],
  index: number,
  once = false,
): string | null {
  let best: string | null = null;
  let bestLen = 0;
  for (const quote of quotes) {
    const q = quote.trim();
    if (!q) continue;
    let from = 0;
    while (from < transcript.length) {
      const i = transcript.indexOf(q, from);
      if (i < 0) break;
      const end = i + q.length;
      if (index >= i && index <= end && q.length > bestLen) {
        best = q;
        bestLen = q.length;
      }
      if (once) break;
      from = end;
    }
  }
  return best;
}
