import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DocumentCard from "../components/DocumentCard";
import { createDocument, listDocuments } from "../lib/api";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      try {
        const items = await listDocuments();
        if (active) {
          setDocuments(items);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => {
      active = false;
    };
  }, []);

  async function handleCreateDocument(event) {
    event.preventDefault();
    setIsCreating(true);
    setError("");

    try {
      const document = await createDocument({
        title: title.trim() || "Untitled document",
      });
      navigate(`/documents/${document.id}`);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-workspace text-[#3c4043]">
      <div className="border-b border-[#dadce0] bg-chrome">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] hover:bg-hover">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a73e8] shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
              <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zm0 1.5L17.5 7H14zM9 11h6v1.5H9zm0 3h6v1.5H9zm0 3h4v1.5H9z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-normal text-[#202124]">Docs</h1>
          </div>
          <button
            type="button"
            className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc]"
          >
            Share
          </button>
        </div>
      </div>

      <div className="border-b border-[#dadce0] bg-[#ffffff]">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-[#5f6368]">Start a new document</p>
              <h2 className="mt-1 text-[28px] font-normal text-[#202124]">Template gallery</h2>
            </div>

            <form onSubmit={handleCreateDocument} className="w-full max-w-[360px]">
              <label className="mb-2 block text-sm text-[#5f6368]" htmlFor="title">
                Document title
              </label>
              <div className="flex gap-2">
                <input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Untitled document"
                  className="h-10 flex-1 rounded-md border border-[#dadce0] bg-white px-3 text-sm outline-none transition focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe]"
                  maxLength={120}
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-md bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:bg-[#a8c7fa]"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {error ? (
          <div className="mb-6 rounded-md border border-[#f1b7b1] bg-[#fce8e6] px-4 py-3 text-sm text-[#d93025]">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl bg-[#ffffff] px-4 py-6 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-medium text-[#202124]">Recent documents</h3>
            <p className="text-sm text-[#5f6368]">{documents.length} files</p>
          </div>

          {isLoading ? (
            <div className="rounded-md border border-dashed border-[#dadce0] bg-[#f8f9fa] p-12 text-center text-sm text-[#5f6368]">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#dadce0] bg-[#f8f9fa] p-12 text-center text-sm text-[#5f6368]">
              No documents yet. Create your first one above.
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
