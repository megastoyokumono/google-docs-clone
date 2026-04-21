# Local Google Docs Clone

A Google Docs-inspired collaborative editor that runs locally with:

- React + Vite + Tailwind on `http://localhost:3000`
- Express + SQLite + WebSockets on `http://localhost:3001`
- Auto-save, document dashboard, rich text toolbar, and live sync between browser tabs/windows

## File Structure

```text
Google Docs/
  client/                 React frontend
    src/
      components/         Toolbar, cards, editor status
      pages/              Dashboard and document editor views
      lib/                API and websocket helpers
  server/                 Express API + SQLite + WebSocket backend
    src/
      db/                 Database setup and queries
      routes/             HTTP endpoints
      services/           Realtime collaboration service
  package.json            Root workspace + single dev command
```

## Architecture

- The frontend loads the dashboard, creates documents, and opens them in a rich text editor powered by a `contentEditable` surface.
- Formatting actions use browser editing commands for a lightweight MVP that supports bold, italic, underline, headings, lists, and alignment.
- The backend stores document metadata and HTML content in SQLite.
- WebSockets broadcast in-progress edits to every client connected to the same document.
- Auto-save pushes the latest HTML to the API after brief inactivity and shows save state in the UI.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Optional: create environment files if you want to override defaults.

The app already has sensible localhost defaults. If you want to customize them, copy the examples below into:

- `client/.env`
- `server/.env`

Client:

```env
# Optional. By default the Vite dev server proxies /api and /ws to localhost:3001.
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

Server:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:3000
DB_PATH=./data/docs.sqlite
REQUEST_SIZE_LIMIT=25mb
MAX_DOCUMENT_LENGTH=10000000
```

3. Start both servers:

```bash
npm run dev
```

4. Open the app:

```text
http://localhost:3000
```

## Available Scripts

- `npm run dev` starts frontend and backend together
- `npm run build` builds both apps
- `npm run start` starts the backend production server

## Notes

- The first backend start creates the SQLite database automatically.
- Open the same document in two browser windows to test live collaboration.
- This MVP does not include authentication or granular permissions.
