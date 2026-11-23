# Subha

Subha is a Tamil-first grounded wisdom chatbot. The frontend is a typed React/TSX application in `frontend/src/main.tsx` built with Vite; the backend is a Rust/Axum service in `src/main.rs`. The server owns SQLite passage lookup and citation cards, so the model cannot create authoritative quotation text or citation metadata.

## Stack

- Rust 1.100+ with Cargo
- Axum and Tokio HTTP server
- SQLite through `rusqlite` with the bundled SQLite library
- React + TypeScript/TSX + Vite
- Existing local corpus at `data/subha.sqlite3`

There is no Python runtime, virtual environment, FastAPI server, or Python test suite in this project.

## Setup

Copy the environment template and enter a real provider key locally if model-generated answers are wanted:

```powershell
Copy-Item .env.example .env
# Edit .env; never commit it.
npm install --prefix frontend
npm run build --prefix frontend
cargo run
```

On Unix:

```sh
cp .env.example .env
npm install --prefix frontend
npm run build --prefix frontend
cargo run
```

Open http://127.0.0.1:8000. The Rust server serves `frontend/dist` and handles `POST /chat`. `GET /health` returns a simple service status.

### Configuration

```dotenv
SCALEMAX_API_KEY=
SCALEMAX_BASE_URL=https://api.scalemax.pro/token/v1
CHAT_MODEL=gpt-5.6-luna
SUBHA_BIND=127.0.0.1:8000
```

`SCALEMAX_BASE_URL` and `CHAT_MODEL` take precedence when nonempty. The Rust backend also accepts `SCALEMAX_API_URL` and `SCALEMAX_MODEL` as aliases. A full `/chat/completions` URL is normalized to its base. Provider failures return a generic Tamil fallback and never expose credentials or upstream response bodies.

Without `SCALEMAX_API_KEY`, exact local references still resolve from SQLite. Substantive non-exact questions return the honest no-match response rather than inventing a quotation.

## Frontend

The UI is TypeScript/TSX, not handwritten JavaScript:

```sh
npm run build --prefix frontend
npm run dev --prefix frontend
```

During Vite development, `/chat` and `/health` are proxied to `http://127.0.0.1:8000`; run the Rust server separately. The production Rust server serves the compiled `frontend/dist` output. The app keeps an opaque session ID in browser storage, renders untrusted content through React text nodes, supports Tamil/English interface labels, and includes browser speech input where available.

## Corpus and provenance

The retained local database contains **1,330 TK rows and 0 CN rows**. The Thirukkural source files are retained in `data/raw/` and were downloaded from `https://raw.githubusercontent.com/tk120404/thirukkural/master/`. The selected `mv` commentary is attributed to **Dr. Mu. Varadarasanar**. `data/manifest.json` records source hashes, hierarchy, and imported counts.

No complete independently verifiable Tamil Chanakya Neeti edition was ingested. The user-supplied Bookey excerpt is a modern secondary summary, not a primary corpus, and the Rust server does not use it as authoritative scripture.

Modern commentary licensing must be cleared before public deployment. The source repository's license does not establish redistribution rights for the modern commentary. Local raw corpus files and generated SQLite/vector artifacts remain ignored by version control pending rights review.

## Rust API

```text
POST /chat
Content-Type: application/json

{"session_id":"browser-session-id","message":"குறள் 391 பற்றி விளக்குங்கள்."}
```

Response:

```json
{
  "reply": "... [TK-0391]",
  "citations": [
    {
      "id": "TK-0391",
      "book": "TK",
      "label": "திருக்குறள் · அதிகாரம் 40 · குறள் 391",
      "text_ta": "...",
      "meaning_ta": "...",
      "meaning_en": null,
      "source": "...",
      "license_note": "..."
    }
  ]
}
```

Exact references supported by the Rust backend include `குறள் 391`, `kural 391`, `திருக்குறள் 391`, direct IDs such as `TK-0391`, and `adhyaya 5 verse 12`. Citation markers are filtered against the passages selected by the server, so an arbitrary model-produced ID cannot pull unrelated rows. Sessions are bounded in memory, expire after one hour, and are local to a single server process.

### How passages are selected

This is lexical retrieval, not semantic/vector search:

- **Tamil questions** match keywords as substrings of `text_ta`, `meaning_ta` and `chapter_title`.
- **English questions** match the source-derived English chapter translations in `data/manifest.json` (for example "What makes a good friend?" resolves to chapter 79, *Friendship*), plus a small explicit English→Tamil keyword bridge in `src/main.rs` (`EN_TOPICS`) for words absent from chapter titles.
- Passages are read from SQLite after selection; the bridge only chooses rows and never supplies verse text.
- If nothing matches, the server returns an honest "no suitable verse" reply instead of padding results.

English chapter matching depends on `data/manifest.json`; if that file is missing, only Tamil keyword matching and the keyword bridge remain active.

## Verification

```powershell
cargo fmt --all -- --check
cargo check
cargo test
npm run build --prefix frontend
```

Start the server first, then run the real endpoint smoke test:

```powershell
node scripts/smoke.mjs --base-url http://127.0.0.1:8000
```

The smoke test sends five Tamil questions, validates the response schema, and prints every returned citation ID, label, and database text. A live provider-backed topical run requires a valid API key; exact local lookup does not.

## Limitations

The Rust replacement reads the already-imported SQLite corpus; the former Python acquisition/embedding pipeline was removed together with the Python backend. Adding a new verified source edition requires a Rust ingestion command or a separately reviewed SQLite import before deployment. Semantic vector retrieval is not claimed when a matching cache is unavailable. There is no authentication, distributed session store, or deployment hardening.