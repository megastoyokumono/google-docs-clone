const blockOptions = [
  { label: "Normal text", value: "<p>" },
  { label: "Heading 1", value: "<h1>" },
  { label: "Heading 2", value: "<h2>" },
];

const fontOptions = ["Arial", "Roboto", "Times New Roman", "Courier New"];
const sizeOptions = [
  { label: "10", value: "2" },
  { label: "11", value: "3" },
  { label: "12", value: "4" },
  { label: "14", value: "5" },
];

function ToolbarButton({ label, title, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded hover:bg-hover text-[#3c4043] transition"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 hidden h-6 w-px bg-[#dadce0] sm:block" />;
}

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.8]">
      {children}
    </svg>
  );
}

export default function EditorToolbar({ onCommand }) {
  return (
    <div className="docs-scrollbar overflow-x-auto rounded-full bg-chrome px-2 py-1.5">
      <div className="flex min-w-max items-center gap-1">
        <select
          defaultValue="Arial"
          onChange={(event) => onCommand("fontName", event.target.value)}
          className="h-9 rounded-md border border-transparent bg-transparent px-3 text-sm text-[#3c4043] outline-none hover:bg-hover"
        >
          {fontOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          defaultValue="3"
          onChange={(event) => onCommand("fontSize", event.target.value)}
          className="h-9 rounded-md border border-transparent bg-transparent px-2 text-sm text-[#3c4043] outline-none hover:bg-hover"
        >
          {sizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          defaultValue="<p>"
          onChange={(event) => onCommand("formatBlock", event.target.value)}
          className="h-9 rounded-md border border-transparent bg-transparent px-3 text-sm text-[#3c4043] outline-none hover:bg-hover"
        >
          {blockOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Divider />

        <ToolbarButton label="Bold" title="Bold (Ctrl+B)" onClick={() => onCommand("bold")}>
          <span className="text-[18px] font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton label="Italic" title="Italic (Ctrl+I)" onClick={() => onCommand("italic")}>
          <span className="text-[18px] italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          title="Underline (Ctrl+U)"
          onClick={() => onCommand("underline")}
        >
          <span className="text-[18px] underline">U</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Align left" onClick={() => onCommand("justifyLeft")}>
          <Icon>
            <path d="M4 7h16M4 12h10M4 17h16" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton label="Center align" onClick={() => onCommand("justifyCenter")}>
          <Icon>
            <path d="M4 7h16M7 12h10M4 17h16" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => onCommand("justifyRight")}>
          <Icon>
            <path d="M4 7h16M10 12h10M4 17h16" />
          </Icon>
        </ToolbarButton>

        <Divider />

        <ToolbarButton label="Bulleted list" onClick={() => onCommand("insertUnorderedList")}>
          <Icon>
            <path d="M9 7h11M9 12h11M9 17h11" />
            <circle cx="5" cy="7" r="1" fill="currentColor" stroke="none" />
            <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="5" cy="17" r="1" fill="currentColor" stroke="none" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => onCommand("insertOrderedList")}>
          <Icon>
            <path d="M10 7h10M10 12h10M10 17h10" />
            <path d="M4.5 6.5h1v2h-1zM4 11.5c.3-.3.8-.5 1.3-.5.8 0 1.2.4 1.2 1 0 .5-.2.8-1 1.3l-1 .6h2.1M4.3 16.2h2c.5 0 .9.3.9.8s-.4.9-1 .9c-.5 0-.9-.2-1.2-.6" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton label="Decrease indent" onClick={() => onCommand("outdent")}>
          <Icon>
            <path d="M10 7h10M10 12h10M10 17h10M4 12h4M6 10l-2 2 2 2" />
          </Icon>
        </ToolbarButton>
        <ToolbarButton label="Increase indent" onClick={() => onCommand("indent")}>
          <Icon>
            <path d="M10 7h10M10 12h10M10 17h10M4 12h4M6 10l2 2-2 2" />
          </Icon>
        </ToolbarButton>
      </div>
    </div>
  );
}
