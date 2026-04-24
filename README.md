# High-Performance Google Docs Clone

A professional-grade, Google Docs-inspired collaborative editor capable of handling 10,000+ pages with real-time sync and auto-pagination.

## 🚀 Key Features

- **Advanced Multi-Page Engine**: A custom DOM-based pagination algorithm that splits content into standard 8.5" x 11" pages in real-time.
- **Full-Width Vertical Scroll**: Professional document viewing experience with a continuous vertical stack layout.
- **Uncontrolled Cursor Stability**: Zero-interference typing using an uncontrolled component pattern to prevent cursor jumps.
- **Interactive Rulers**: Real-time margin adjustment with horizontal and vertical rulers.
- **Real-Time Collaboration**: Powered by WebSockets for instant sync across multiple collaborators.
- **Smart Auto-Save & Sync**: Immediate state synchronization with background persistence and local draft recovery.
- **Authentication System**: Secure Sign-up and Login with session-based access control.
- **Rich Text Toolbar**: Full support for fonts (with previews), headings, alignment, lists, and line spacing.

## 🛠️ Technology Stack

- **Frontend**: React + Vite + Vanilla CSS (Aesthetic-first design)
- **Backend**: Node.js + Express + WebSocket
- **Database**: SQLite for persistent storage
- **Communication**: WebSockets for real-time state broadcasting

## 📁 File Structure

```text
Google Docs/
  client/                 React frontend
    src/
      components/         Toolbar, Rulers, MenuBar, Document Cards
      pages/              Editor, Dashboard, Login, Signup
      lib/                API, WebSocket, Auth Context
  server/                 Express API + SQLite + WebSocket backend
    src/
      db/                 Repositories (Auth, Documents)
      routes/             HTTP endpoints
      services/           Real-time collaboration logic
```

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the environment**:
   ```bash
   npm run dev
   ```
   *Frontend: `http://localhost:3000`*
   *Backend: `http://localhost:3001`*

3. **Collaboration**:
   Open the same document in two separate browser windows to see the live sync in action.

## 🧠 Core Algorithms

### Pagination (`paginateContent`)
The editor uses a custom measurement engine that clones DOM nodes into a hidden container to calculate exact heights. It supports splitting paragraphs and words across page boundaries to ensure a perfect word-processor feel.

### Cursor Stability
By bypassing React's standard controlled component pattern for the active editing surface, the editor avoids the common "cursor jump" bug associated with `contentEditable` in React.

---
Built with ❤️ for High-Performance Document Editing.
