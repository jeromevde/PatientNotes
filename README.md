# Simplycure — dossier + note-taker (prototype)

Fictional patient data only. Paste a consultation transcript → structured notes appear **beside** it → practitioner reviews → note is attached to the dossier (the patient profile is **not** updated).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a key, Generate returns the mock notes.

## Files to read

| File | What it is |
|---|---|
| `data/patient.json` | Dossier (identity, history, current recs, labs) |
| `data/products.json` | Mini-catalogue. Notes may only reference these `id`s |
| `data/transcript.json` | Free-text transcript (the model input) |
| `data/notes.json` | Mock structured notes + transcript quotes (fallback) |
| `lib/schema.ts` | Zod contract the LLM must return |
| `schemas.md` | Input / output schema choices (short) |
| `app/api/notes/route.ts` | One LLM call (or mock). Filters unknown product ids |
| `app/page.tsx` | Flow: dossier → split view (transcript + notes) → confirm |
| `components/` | Dossier + note-taker workspace |

## API keys

Copy `.env.example` → `.env.local`.

| Var | Where |
|---|---|
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) · also set on Vercel |
| `OPENROUTER_MODEL` | Default `anthropic/claude-haiku-4.5` (swap without code changes) |
| `OPENROUTER_SITE_URL` | Optional. Localhost locally, your Vercel URL in prod |

No other keys. No DB, no auth.

**Production (real patients):** OpenRouter is a middleman — use a ZDR provider directly + auth. Out of scope here.
