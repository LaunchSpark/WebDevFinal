# BlockDraft

BlockDraft is a block-based resume editor built with an Express backend, SQLite storage, and a plain HTML/CSS/JavaScript frontend.

## Run

Web mode:

```bash
npm start
```

Electron desktop mode:

```bash
npm run electron:dev
```

The Electron app starts its own embedded local server. You do not need to run `npm start` separately.

## Packaging

Build an unpacked Electron app:

```bash
npm run electron:pack
```

Build distributable desktop artifacts:

```bash
npm run electron:dist
```

## Runtime Data

Web/server development mode uses repo-local runtime files by default:

- `blockdraft.db`
- `.env`

Packaged Electron builds store writable runtime data in the per-user Electron data directory:

- SQLite DB: `blockdraft.db`
- Gemini config env file: `.env`

This avoids writing into the installed app bundle.

## Notes

- `gemini_key` is persisted in `.env`.
- Resume content and `resume_header` are persisted in SQLite.
- `better-sqlite3` is a native module, so Electron packaging must include its rebuilt binary.
