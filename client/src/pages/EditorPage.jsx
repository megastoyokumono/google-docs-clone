import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EditorToolbar from "../components/EditorToolbar";
import SaveIndicator from "../components/SaveIndicator";
import { getDocument, saveDocument, saveDocumentImmediately } from "../lib/api";
import { connectToDocument } from "../lib/websocket";

const SAVE_DEBOUNCE_MS = 900;
const menuItems = ["File", "Edit", "View", "Insert", "Format", "Tools", "Help"];
const draftStorageKey = (documentId) => `docs-clone:draft:${documentId}`;

function DocsLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a73e8] shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zm0 1.5L17.5 7H14zM9 11h6v1.5H9zm0 3h6v1.5H9zm0 3h4v1.5H9z" />
      </svg>
    </div>
  );
}

function IconButton({ label, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] transition hover:bg-[#e8eaed]"
    >
      {children}
    </button>
  );
}

export default function EditorPage() {
  const { documentId } = useParams();
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const latestDraftRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const [documentState, setDocumentState] = useState(null);
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [error, setError] = useState("");
  const [collaborationState, setCollaborationState] = useState("Connecting...");

  const emitRealtimeUpdate = useEffectEvent((nextTitle, nextContent) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "document:update",
        documentId,
        title: nextTitle,
        content: nextContent,
        sourceClientId: socketRef.current.clientId,
      }),
    );
  });

  const persistDraftLocally = useEffectEvent((nextTitle, nextContent) => {
    const draft = {
      title: nextTitle,
      content: nextContent,
      updatedAt: new Date().toISOString(),
    };

    latestDraftRef.current = draft;
    window.localStorage.setItem(draftStorageKey(documentId), JSON.stringify(draft));
  });

  const clearLocalDraft = useEffectEvent(() => {
    latestDraftRef.current = null;
    window.localStorage.removeItem(draftStorageKey(documentId));
  });

  const queueSave = useEffectEvent((nextTitle, nextContent) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setSaveStatus("saving");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const saved = await saveDocument(documentId, {
          title: nextTitle,
          content: nextContent,
        });
        setDocumentState(saved);
        setTitle(saved.title);
        setLastSavedAt(saved.updatedAt);
        setSaveStatus("saved");
        clearLocalDraft();
      } catch (saveError) {
        setSaveStatus("error");
        setError(saveError.message);
      }
    }, SAVE_DEBOUNCE_MS);
  });

  const syncEditorState = useEffectEvent(() => {
    if (!editorRef.current || isRemoteUpdateRef.current) {
      return;
    }

    const content = editorRef.current.innerHTML;
    const nextTitle = title.trim() || "Untitled document";
    persistDraftLocally(nextTitle, content);
    emitRealtimeUpdate(nextTitle, content);
    queueSave(nextTitle, content);
  });

  const applyCommand = useEffectEvent((command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorState();
  });

  useEffect(() => {
    let active = true;

    async function loadDocument() {
      try {
        const result = await getDocument(documentId);
        if (!active) {
          return;
        }

        const savedDraft = window.localStorage.getItem(draftStorageKey(documentId));
        let draft = null;
        if (savedDraft) {
          try {
            draft = JSON.parse(savedDraft);
            latestDraftRef.current = draft;
          } catch {
            window.localStorage.removeItem(draftStorageKey(documentId));
          }
        }

        const initialDocument =
          draft && typeof draft.content === "string" && typeof draft.title === "string"
            ? {
                ...result,
                title: draft.title,
                content: draft.content,
                updatedAt: draft.updatedAt || result.updatedAt,
              }
            : result;

        setDocumentState(initialDocument);
        setTitle(initialDocument.title);
        setLastSavedAt(initialDocument.updatedAt);

        if (editorRef.current) {
          editorRef.current.innerHTML = initialDocument.content || "<p></p>";
        }

        if (draft) {
          queueSave(initialDocument.title, initialDocument.content || "<p></p>");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      }
    }

    loadDocument();

    return () => {
      active = false;
    };
  }, [documentId]);

  useEffect(() => {
    const socket = connectToDocument(documentId, {
      onOpen() {
        setCollaborationState("Live");
      },
      onClose() {
        setCollaborationState("Offline");
      },
      onError() {
        setCollaborationState("Connection issue");
      },
      onMessage(payload) {
        if (payload.type !== "document:update") {
          return;
        }

        if (payload.sourceClientId === socketRef.current?.clientId) {
          return;
        }

        if (!editorRef.current) {
          return;
        }

        isRemoteUpdateRef.current = true;
        editorRef.current.innerHTML = payload.content;
        setTitle(payload.title);
        setLastSavedAt(payload.updatedAt);
        setSaveStatus("saved");

        window.setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 0);
      },
    });

    socket.clientId = crypto.randomUUID();
    socketRef.current = socket;

    function flushPendingChanges() {
      if (!editorRef.current || isRemoteUpdateRef.current) {
        return;
      }

      const nextTitle = latestDraftRef.current?.title || title.trim() || "Untitled document";
      const nextContent = editorRef.current.innerHTML || latestDraftRef.current?.content || "<p></p>";
      persistDraftLocally(nextTitle, nextContent);

      saveDocumentImmediately(documentId, {
        title: nextTitle,
        content: nextContent,
      }).catch(() => {
        // Leave the local draft in place so the latest content is restored on reload.
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushPendingChanges();
      }
    }

    window.addEventListener("beforeunload", flushPendingChanges);
    window.addEventListener("pagehide", flushPendingChanges);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushPendingChanges);
      window.removeEventListener("pagehide", flushPendingChanges);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      socket.close();
    };
  }, [documentId]);

  useEffect(() => {
    function onKeyDown(event) {
      if (!editorRef.current || !editorRef.current.contains(document.activeElement)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && ["b", "i", "u"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        const map = { b: "bold", i: "italic", u: "underline" };
        editorRef.current?.focus();
        document.execCommand(map[event.key.toLowerCase()], false, null);

        if (!editorRef.current || isRemoteUpdateRef.current) {
          return;
        }

        const content = editorRef.current.innerHTML;
        const nextTitle = title.trim() || "Untitled document";
        persistDraftLocally(nextTitle, content);
        emitRealtimeUpdate(nextTitle, content);
        queueSave(nextTitle, content);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [title]);

  const headingText = useMemo(() => title || "Untitled document", [title]);

  function handleTitleChange(event) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      persistDraftLocally(nextTitle || "Untitled document", content);
      emitRealtimeUpdate(nextTitle || "Untitled document", content);
      queueSave(nextTitle || "Untitled document", content);
    }
  }

  if (error && !documentState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-workspace px-6">
        <div className="max-w-md rounded-2xl border border-[#dadce0] bg-white p-8 text-center shadow-paper">
          <p className="text-lg font-semibold text-[#202124]">Unable to load document</p>
          <p className="mt-3 text-sm text-[#5f6368]">{error}</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-workspace">
      <div className="border-b border-[#dadce0] bg-chrome px-2 py-2 sm:px-4">
        <div className="flex flex-wrap items-start gap-2">
          <div className="flex items-start gap-1">
            <IconButton label="Main menu">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </IconButton>
            <Link to="/" className="hidden sm:block">
              <DocsLogo />
            </Link>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={title}
                    onChange={handleTitleChange}
                    className="h-10 min-w-0 rounded-md border border-transparent bg-transparent px-3 text-[18px] font-normal text-[#202124] outline-none transition hover:bg-[#f1f3f4] focus:border-[#c2dbff] focus:bg-white"
                    maxLength={120}
                    placeholder="Untitled document"
                  />
                  <span className="hidden rounded-full border border-[#dadce0] px-3 py-1 text-xs text-[#5f6368] sm:inline-flex">
                    Local Docs
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="rounded px-3 py-1.5 text-[14px] text-[#3c4043] transition hover:bg-[#e8eaed]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
                <div className="rounded-full px-3 py-1.5 text-[13px] text-[#5f6368] hover:bg-[#e8eaed]">
                  {collaborationState}
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1765cc]"
                >
                  Share
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c2e7ff] text-sm font-medium text-[#174ea6]">
                  U
                </div>
              </div>
            </div>

            <div className="mt-2">
              <EditorToolbar onCommand={applyCommand} />
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-auto mt-4 max-w-[1600px] px-4">
          <div className="rounded-md border border-[#f1b7b1] bg-[#fce8e6] px-4 py-3 text-sm text-[#d93025]">
            {error}
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-6">
        <div className="flex justify-center">
          <section className="w-full max-w-[980px]">
            <div className="mb-4 flex items-center justify-between px-2 text-[13px] text-[#5f6368]">
              <div className="flex items-center gap-4">
                <span>100%</span>
                <span>Editing</span>
              </div>
              <span>Arial 11</span>
            </div>

            <div className="rounded-sm bg-transparent px-2 pb-4 pt-2">
              <div className="mx-auto min-h-[1056px] w-full max-w-[816px] bg-white px-[72px] py-[72px] shadow-paper">
                <div className="mb-6 border-b border-[#f1f3f4] pb-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#9aa0a6]">
                    Document
                  </p>
                  <h1 className="mt-2 text-[28px] font-normal text-[#202124]">
                    {headingText}
                  </h1>
                </div>

                <div
                  ref={editorRef}
                  className="editor-content min-h-[760px] whitespace-pre-wrap break-words font-['Arial'] text-[14.67px] leading-[1.6] text-[#202124] outline-none"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Start typing here..."
                  onInput={syncEditorState}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
