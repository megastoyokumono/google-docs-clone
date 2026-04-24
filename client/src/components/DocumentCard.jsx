import { Link } from "react-router-dom";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DocumentCard({ document }) {
  let firstPageContent = document.content;
  try {
    const pages = JSON.parse(document.content);
    firstPageContent = pages[0] || "";
  } catch {
    firstPageContent = document.content || "";
  }

  const hasContent = firstPageContent && firstPageContent !== "<p></p>" && firstPageContent.trim() !== "";
  
  return (
    <Link
      to={`/documents/${document.id}`}
      className="group block w-[180px] rounded-lg p-0 transition"
    >
      <div className="rounded-sm border border-[#dadce0] bg-white shadow-paper transition group-hover:border-[#c6dafc] group-hover:shadow-md">
        <div className="mx-auto mt-3 h-[220px] w-[154px] overflow-hidden rounded-[1px] border border-[#edf0f2] bg-white relative">
          {hasContent ? (
            <div
              className="absolute left-0 top-0 w-[816px] origin-top-left scale-[0.1887] bg-white px-[72px] py-[72px] font-['Arial'] text-[14.67px] leading-[1.6] text-[#202124] pointer-events-none break-words whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: firstPageContent }}
            />
          ) : (
            <div className="px-4 py-5">
              <div className="h-3 w-20 rounded bg-[#e8eaed]" />
              <div className="mt-4 h-2 w-full rounded bg-[#f1f3f4]" />
              <div className="mt-2 h-2 w-5/6 rounded bg-[#f1f3f4]" />
              <div className="mt-2 h-2 w-4/6 rounded bg-[#f1f3f4]" />
            </div>
          )}
        </div>
      </div>
      <p className="mt-12 truncate text-[14px] font-medium text-[#202124]">{document.title}</p>
      <p className="mt-1 text-xs text-[#5f6368]">
        Updated {formatDate(document.updatedAt)}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-[#5f6368]">
        {document.preview || "Start writing to see a preview."}
      </p>
    </Link>
  );
}
