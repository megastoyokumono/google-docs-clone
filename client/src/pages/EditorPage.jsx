import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EditorToolbar from "../components/EditorToolbar";
import SaveIndicator from "../components/SaveIndicator";
import { getDocument, saveDocument, deleteDocument } from "../lib/api";
import { connectToDocument } from "../lib/websocket";
import { useAuth } from "../lib/AuthContext";
import MenuBar from "../components/MenuBar";
import { HorizontalRuler, VerticalRuler } from "../components/Rulers";

const SAVE_DEBOUNCE_MS = 900;
const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const PAGE_CANVAS_PADDING_X = 24;
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



export default function EditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const latestDraftRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const isLocalActionRef = useRef(false);

  const [documentState, setDocumentState] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [error, setError] = useState("");
  const [collaborationState, setCollaborationState] = useState("Connecting...");
  
  // Multi-page state
  const [pages, setPages] = useState(["<p></p>"]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [margins, setMargins] = useState({ top: 72, right: 72, bottom: 72, left: 72 });
  const [lineSpacing, setLineSpacing] = useState("1.6");

  // Sidebar Virtualization
  // Removed as sidebar was deleted

  const emitRealtimeUpdate = useEffectEvent((nextTitle, nextPages, nextLineSpacing, nextMargins) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "document:update",
        documentId,
        title: nextTitle,
        content: JSON.stringify(nextPages),
        lineSpacing: nextLineSpacing,
        margins: JSON.stringify(nextMargins),
        sourceClientId: socketRef.current.clientId,
      }),
    );
  });

  const persistDraftLocally = useEffectEvent((nextTitle, nextPages, nextLineSpacing, nextMargins) => {
    const draft = {
      title: nextTitle,
      content: JSON.stringify(nextPages),
      lineSpacing: nextLineSpacing,
      margins: JSON.stringify(nextMargins),
      updatedAt: new Date().toISOString(),
    };

    latestDraftRef.current = draft;
    window.localStorage.setItem(draftStorageKey(documentId), JSON.stringify(draft));
  });

  const clearLocalDraft = useEffectEvent(() => {
    latestDraftRef.current = null;
    window.localStorage.removeItem(draftStorageKey(documentId));
  });

  const queueSave = useEffectEvent((nextTitle, nextPages, nextLineSpacing, nextMargins) => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setSaveStatus("saving");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const saved = await saveDocument(documentId, {
          title: nextTitle,
          content: JSON.stringify(nextPages),
          lineSpacing: nextLineSpacing,
          margins: JSON.stringify(nextMargins),
        });
        setDocumentState(saved);
        setTitle(saved.title);
        setLineSpacing(saved.lineSpacing || "1.6");
        setLastSavedAt(saved.updatedAt);
        setSaveStatus("saved");
        clearLocalDraft();
      } catch (saveError) {
        setSaveStatus("error");
        setError(saveError.message);
      }
    }, SAVE_DEBOUNCE_MS);
  });

  const forceSave = useEffectEvent(async () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    const nextTitle = title.trim() || "Untitled document";
    const nextPages = [...pages];
    if (editorRef.current) {
      nextPages[activePageIndex] = editorRef.current.innerHTML;
    }
    const nextLineSpacing = lineSpacing;
    const nextMargins = margins;

    setSaveStatus("saving");
    try {
      const saved = await saveDocument(documentId, {
        title: nextTitle,
        content: JSON.stringify(nextPages),
        lineSpacing: nextLineSpacing,
        margins: JSON.stringify(nextMargins),
      });
      setDocumentState(saved);
      setTitle(saved.title);
      setLineSpacing(saved.lineSpacing || "1.6");
      setLastSavedAt(saved.updatedAt);
      setSaveStatus("saved");
      clearLocalDraft();
    } catch (saveError) {
      setSaveStatus("error");
      setError(saveError.message);
    }
  });

  const syncEditorState = useEffectEvent((forcedPages = null) => {
    if (!editorRef.current || isRemoteUpdateRef.current) {
      return;
    }

    const currentContent = editorRef.current.innerHTML;
    // Use forcedPages if provided (from a multi-page action), otherwise use current state
    const basePages = forcedPages || pages;
    const nextPages = [...basePages];
    nextPages[activePageIndex] = currentContent;
    
    // Mark as local action to prevent cursor jumping in the useEffect
    isLocalActionRef.current = true;
    setPages(nextPages);

    const nextTitle = title.trim() || "Untitled document";
    persistDraftLocally(nextTitle, nextPages, lineSpacing, margins);
    emitRealtimeUpdate(nextTitle, nextPages, lineSpacing, margins);
    queueSave(nextTitle, nextPages, lineSpacing, margins);
  });

  // Clear local action flag after render to ensure cursor stability
  useEffect(() => {
    isLocalActionRef.current = false;
  }, [pages]);

  const applyCommand = useEffectEvent((command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorState();
  });

  const addPage = () => {
    const nextPages = [...pages, "<p></p>"];
    setPages(nextPages);
    setActivePageIndex(nextPages.length - 1);
    
    // Sync change
    const nextTitle = title.trim() || "Untitled document";
    persistDraftLocally(nextTitle, nextPages, lineSpacing, margins);
    emitRealtimeUpdate(nextTitle, nextPages, lineSpacing, margins);
    queueSave(nextTitle, nextPages, lineSpacing, margins);
  };

  const removePage = (index) => {
    if (pages.length <= 1) return;
    const nextPages = pages.filter((_, i) => i !== index);
    setPages(nextPages);
    setActivePageIndex(Math.max(0, activePageIndex >= nextPages.length ? nextPages.length - 1 : activePageIndex));
    
    // Sync change
    const nextTitle = title.trim() || "Untitled document";
    persistDraftLocally(nextTitle, nextPages, lineSpacing, margins);
    emitRealtimeUpdate(nextTitle, nextPages, lineSpacing, margins);
    queueSave(nextTitle, nextPages, lineSpacing, margins);
  };

  const switchPage = (index) => {
    if (index < 0 || index >= pages.length) return;

    // 1. Save current content to state
    const currentPages = [...pages];
    if (editorRef.current) {
      currentPages[activePageIndex] = editorRef.current.innerHTML;
      setPages(currentPages);
    }

    // 2. Change active index
    setActivePageIndex(index);

    // 3. Scroll the page into view
    const element = document.getElementById(`page-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 4. Update editor content logic is handled by React render in the vertical stack
  };

  const paginateContent = (html) => {
    const m = margins || { top: 72, right: 72, bottom: 72, left: 72 };
    const width = PAGE_WIDTH - m.left - m.right;
    const maxHeight = PAGE_HEIGHT - m.top - m.bottom;

    const measure = document.createElement("div");
    measure.style.width = `${width}px`;
    measure.style.position = "fixed";
    measure.style.top = "0";
    measure.style.left = "-10000px";
    measure.style.whiteSpace = "pre-wrap";
    measure.style.wordBreak = "break-word";
    measure.style.lineHeight = lineSpacing || "1.6";
    measure.style.visibility = "hidden";
    measure.className = "editor-content font-['Arial'] text-[14.67px]";
    document.body.appendChild(measure);

    const resultPages = [];
    const temp = document.createElement("div");
    temp.innerHTML = (html || "").replace(/<!--[\s\S]*?-->/g, "");

    const addNodeToPages = (node) => {
      const clone = node.cloneNode(true);
      measure.appendChild(clone);

      if (measure.offsetHeight > maxHeight) {
        measure.removeChild(clone);

        if (measure.innerHTML.trim() !== "") {
          resultPages.push(measure.innerHTML);
          measure.innerHTML = "";
          // If after clearing, it still overflows, we must split it.
          // We don't call addNodeToPages recursively here to avoid infinite loops.
          // Instead, we fall through to the splitting logic.
          measure.appendChild(clone);
          if (measure.offsetHeight <= maxHeight) {
            // It fits now!
            return;
          }
          measure.removeChild(clone);
        }
        
        // Split logic
        if (node.nodeType === Node.TEXT_NODE) {
          const words = node.textContent.split(/(\s+)/);
          for (const word of words) {
            const textNode = document.createTextNode(word);
            measure.appendChild(textNode);
            if (measure.offsetHeight > maxHeight) {
              measure.removeChild(textNode);
              if (measure.innerHTML.trim() !== "") {
                resultPages.push(measure.innerHTML);
                measure.innerHTML = "";
                measure.appendChild(textNode);
              } else {
                // Hard break for long words
                resultPages.push(word);
                measure.innerHTML = "";
              }
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length > 0) {
          // Recurse into children
          Array.from(node.childNodes).forEach(addNodeToPages);
        } else {
          // Leaf element too big, just force it and move on
          resultPages.push(node.outerHTML);
          measure.innerHTML = "";
        }
      }
    };

    Array.from(temp.childNodes).forEach(addNodeToPages);
    if (measure.innerHTML.trim() !== "") {
      resultPages.push(measure.innerHTML);
    }

    document.body.removeChild(measure);
    
    // Safety check: if resultPages is empty but input was not, return the input as one page
    if (resultPages.length === 0 && html.trim() !== "") {
      return [html];
    }
    
    return resultPages.length > 0 ? resultPages : ["<p></p>"];
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html") || 
                 e.clipboardData.getData("text/plain").split("\n").map(p => `<p>${p.trim() || "&nbsp;"}</p>`).join("");
    
    if (!html) return;

    // Handle empty first page replacement
    const currentContent = pages[activePageIndex] || "";
    const isEmptyDoc = pages.length === 1 && (
      !currentContent || 
      currentContent === "<p></p>" || 
      currentContent === "<p><br></p>" || 
      currentContent.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim() === ""
    );
    
    if (isEmptyDoc) {
      const paginated = paginateContent(html.replace(/<!--[\s\S]*?-->/g, ""));
      if (editorRef.current) {
        editorRef.current.innerHTML = paginated[0] || "<p></p>";
      }
      setPages(paginated);
      setActivePageIndex(0);
      syncEditorState(paginated);
      return;
    }

    // Use native command to insert HTML at cursor - this is much more stable
    document.execCommand("insertHTML", false, html.replace(/<!--[\s\S]*?-->/g, ""));
    
    // After insertion, check if we need to split the current page
    setTimeout(() => {
      if (!editorRef.current) return;
      
      const fullHtml = editorRef.current.innerHTML;
      const paginated = paginateContent(fullHtml);
      
      if (paginated.length > 1) {
        const [first, ...rest] = paginated;
        const nextPages = [...pages];
        nextPages[activePageIndex] = first;
        nextPages.splice(activePageIndex + 1, 0, ...rest);
        
        // Immediately sync the new multi-page state
        editorRef.current.innerHTML = first;
        syncEditorState(nextPages);
      } else {
        syncEditorState();
      }
    }, 10);
  };

  useEffect(() => {
    let active = true;

    async function loadDocument() {
      try {
        const result = await getDocument(documentId);
        if (!active) return;

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

        const initialDocument = draft || result;
        
        let initialPages = ["<p></p>"];
        try {
           initialPages = JSON.parse(initialDocument.content);
           if (!Array.isArray(initialPages)) initialPages = [initialDocument.content || "<p></p>"];
        } catch {
           initialPages = [initialDocument.content || "<p></p>"];
        }

        let initialMargins = { top: 72, right: 72, bottom: 72, left: 72 };
        try {
          if (initialDocument.margins) initialMargins = JSON.parse(initialDocument.margins);
        } catch {
          // ignore margins parse error
        }

        setDocumentState(result);
        setTitle(initialDocument.title);
        setPages(initialPages);
        setMargins(initialMargins);
        setLineSpacing(initialDocument.lineSpacing || "1.6");
        setLastSavedAt(initialDocument.updatedAt);

        if (editorRef.current) {
          editorRef.current.innerHTML = initialPages[0] || "<p></p>";
        }

        if (draft) {
          queueSave(initialDocument.title, initialPages, initialDocument.lineSpacing || "1.6", initialMargins);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      }
    }

    loadDocument();
    return () => { active = false; };
  }, [documentId]);

  useEffect(() => {
    const socket = connectToDocument(documentId, {
      onOpen() { setCollaborationState("Live"); },
      onClose() { setCollaborationState("Offline"); },
      onError() { setCollaborationState("Connection issue"); },
      onMessage(payload) {
        if (payload.type !== "document:update") return;
        if (payload.sourceClientId === socketRef.current?.clientId) return;
        if (!editorRef.current) return;

        isRemoteUpdateRef.current = true;
        
        let remotePages = [];
        try {
          remotePages = JSON.parse(payload.content);
        } catch { remotePages = [payload.content]; }
        
        let remoteMargins = { top: 72, right: 72, bottom: 72, left: 72 };
        try {
          if (payload.margins) remoteMargins = JSON.parse(payload.margins);
        } catch {
          // ignore margins parse error
        }

        setPages(remotePages);
        setMargins(remoteMargins);
        setTitle(payload.title);
        if (payload.lineSpacing) setLineSpacing(payload.lineSpacing);
        setLastSavedAt(payload.updatedAt);
        setSaveStatus("saved");

        // Update editor if current page changed remotely
        if (remotePages[activePageIndex] !== undefined) {
          editorRef.current.innerHTML = remotePages[activePageIndex];
        }

        window.setTimeout(() => { isRemoteUpdateRef.current = false; }, 0);
      },
    });

    socket.clientId = crypto.randomUUID();
    socketRef.current = socket;

    return () => { socket.close(); };
  }, [documentId, activePageIndex]);

  // Update editor content when activePageIndex changes or remote updates arrive
  useEffect(() => {
    if (editorRef.current && pages[activePageIndex] !== undefined) {
      // Only update if current editor content is different AND it's not a local change
      if (editorRef.current.innerHTML !== pages[activePageIndex] && !isLocalActionRef.current) {
        isRemoteUpdateRef.current = true;
        editorRef.current.innerHTML = pages[activePageIndex];
        window.setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 0);
      }
    }
  }, [activePageIndex, pages]);

  function handleLogout() {
    logout();
    navigate("/login");
  }
  function handleTitleChange(event) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    syncEditorState();
  }

  function handleLineSpacingChange(newLineSpacing) {
    setLineSpacing(newLineSpacing);
    // Trigger sync
    const nextTitle = title.trim() || "Untitled document";
    persistDraftLocally(nextTitle, pages, newLineSpacing, margins);
    emitRealtimeUpdate(nextTitle, pages, newLineSpacing, margins);
    queueSave(nextTitle, pages, newLineSpacing, margins);
  }

  const handleMarginChange = (newMargins) => {
    setMargins(newMargins);
    // Trigger sync
    const nextTitle = title.trim() || "Untitled document";
    persistDraftLocally(nextTitle, pages, lineSpacing, newMargins);
    emitRealtimeUpdate(nextTitle, pages, lineSpacing, newMargins);
    queueSave(nextTitle, pages, lineSpacing, newMargins);
  };

  async function handleDeleteDocument() {
    try {
      await deleteDocument(documentId);
      navigate("/");
    } catch (deleteError) {
      setError(deleteError.message);
      setShowDeleteConfirm(false);
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
    <main className="min-h-screen bg-workspace flex flex-col">
      {/* Header */}
      <div className="border-b border-[#dadce0] bg-chrome px-4 py-2 shrink-0">
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-1">
            <Link to="/">
              <DocsLogo />
            </Link>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <input
                    value={title}
                    onChange={handleTitleChange}
                    className="h-8 min-w-0 rounded-md border border-transparent bg-transparent px-2 text-[18px] font-normal text-[#202124] outline-none transition hover:bg-[#f1f3f4] focus:border-[#c2dbff] focus:bg-white"
                    maxLength={120}
                    placeholder="Untitled document"
                  />
                  <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
                </div>
                <MenuBar onCommand={applyCommand} editorRef={editorRef} onSave={forceSave} />
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[13px] text-[#5f6368]">{collaborationState}</div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded bg-[#fce8e6] px-3 py-1.5 text-sm font-medium text-[#d93025] hover:bg-[#f5c6c1]"
                >
                  Delete
                </button>
                <button className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1765cc]">
                  Share
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-[#dadce0] px-3 py-1.5 text-sm font-medium text-[#3c4043] transition hover:bg-[#f1f3f4]"
                >
                  Sign out
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c2e7ff] text-sm font-medium text-[#174ea6]">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
              </div>
            </div>

            <div className="mt-1">
              <EditorToolbar 
                onCommand={applyCommand} 
                lineSpacing={lineSpacing}
                onLineSpacingChange={handleLineSpacingChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 overflow-y-auto bg-[#f0f4f9] docs-scrollbar relative flex flex-col items-center py-12 gap-10">
          {pages.map((page, index) => (
            <div 
              key={index}
              id={`page-${index}`}
              className={`bg-white shadow-paper relative shrink-0 transition-shadow ${
                activePageIndex === index ? 'ring-2 ring-[#1a73e8] ring-offset-4 ring-offset-[#f0f4f9]' : ''
              }`}
              style={{
                width: `${PAGE_WIDTH}px`,
                height: `${PAGE_HEIGHT}px`,
              }}
              onClick={() => setActivePageIndex(index)}
            >
              {/* Rulers on the first page container */}
              {index === 0 && (
                <>
                   <div className="absolute -top-10 left-0 w-full">
                      <HorizontalRuler
                        pageWidth={PAGE_WIDTH}
                        leftMargin={margins.left}
                        rightMargin={margins.right}
                        onChange={(m) => handleMarginChange({ ...margins, left: m.left, right: m.right })}
                      />
                   </div>
                   <div className="absolute top-0 -left-10 h-full">
                      <VerticalRuler
                        pageHeight={PAGE_HEIGHT}
                        topMargin={margins.top}
                        bottomMargin={margins.bottom}
                        onChange={(m) => handleMarginChange({ ...margins, top: m.top, bottom: m.bottom })}
                      />
                   </div>
                </>
              )}

              <div
                className="absolute inset-0 box-border overflow-hidden"
                style={{
                  padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`
                }}
              >
                <div
                  ref={activePageIndex === index ? editorRef : null}
                  className="editor-content min-h-full whitespace-pre-wrap break-words text-[14.67px] text-[#202124] outline-none"
                  style={{ lineHeight: lineSpacing, fontFamily: 'Arial, sans-serif' }}
                  contentEditable={activePageIndex === index}
                  suppressContentEditableWarning
                  onInput={() => syncEditorState()}
                  onPaste={handlePaste}
                  // ONLY use dangerouslySetInnerHTML for pages you are NOT currently typing on.
                  // For the active page, we manage content manually via refs to prevent cursor jumps.
                  dangerouslySetInnerHTML={activePageIndex !== index ? { __html: page } : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-medium text-[#202124]">Delete document?</h2>
            <p className="mt-2 text-sm text-[#5f6368]">
              This will permanently delete &ldquo;{title || "Untitled document"}&rdquo;. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-full border border-[#dadce0] px-4 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f1f3f4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDocument}
                className="rounded-full bg-[#d93025] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#c5221f]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
