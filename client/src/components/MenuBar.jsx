import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MenuBar({ onCommand, editorRef, onSave }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const menuBarRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menus = {
    File: [
      { label: "New", action: () => navigate("/") },
      { label: "Save", shortcut: "Ctrl+S", action: () => { if (onSave) onSave(); } },
      { label: "Print", action: () => window.print() },
    ],
    Edit: [
      { label: "Undo", shortcut: "Ctrl+Z", action: () => onCommand("undo") },
      { label: "Redo", shortcut: "Ctrl+Y", action: () => onCommand("redo") },
      { divider: true },
      { label: "Cut", shortcut: "Ctrl+X", action: () => onCommand("cut") },
      { label: "Copy", shortcut: "Ctrl+C", action: () => onCommand("copy") },
      { label: "Paste", shortcut: "Ctrl+V", action: () => alert("Please use Ctrl+V or your browser's Edit menu to paste") },
      { divider: true },
      { label: "Select All", shortcut: "Ctrl+A", action: () => onCommand("selectAll") },
    ],
    View: [
      { label: "Print layout", action: () => {} },
      { label: "Mode", action: () => {} },
    ],
    Insert: [
      { label: "Image", action: () => {
          const url = prompt("Enter image URL:");
          if (url) onCommand("insertImage", url);
        }
      },
      { label: "Link", shortcut: "Ctrl+K", action: () => {
          const url = prompt("Enter link URL:");
          if (url) onCommand("createLink", url);
        }
      },
      { divider: true },
      { label: "Horizontal line", action: () => onCommand("insertHorizontalRule") },
    ],
    Format: [
      { label: "Bold", shortcut: "Ctrl+B", action: () => onCommand("bold") },
      { label: "Italic", shortcut: "Ctrl+I", action: () => onCommand("italic") },
      { label: "Underline", shortcut: "Ctrl+U", action: () => onCommand("underline") },
      { label: "Strikethrough", action: () => onCommand("strikeThrough") },
      { divider: true },
      { label: "Clear formatting", action: () => onCommand("removeFormat") },
    ],
    Tools: [
      { label: "Word count", shortcut: "Ctrl+Shift+C", action: () => {
          if (editorRef?.current) {
            const text = editorRef.current.innerText || "";
            const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
            const chars = text.length;
            alert(`Word count:\nWords: ${words}\nCharacters: ${chars}`);
          }
        }
      },
    ],
    Help: [
      { label: "Keyboard shortcuts", action: () => {
          alert("Basic Shortcuts:\nCtrl+B: Bold\nCtrl+I: Italic\nCtrl+U: Underline\nCtrl+Z: Undo\nCtrl+Y: Redo");
        }
      },
    ],
  };

  function handleMenuClick(menuName) {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  }

  function handleMenuMouseEnter(menuName) {
    if (activeMenu && activeMenu !== menuName) {
      setActiveMenu(menuName);
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 relative" ref={menuBarRef}>
      {Object.keys(menus).map((menuName) => (
        <div key={menuName} className="relative">
          <button
            type="button"
            onClick={() => handleMenuClick(menuName)}
            onMouseEnter={() => handleMenuMouseEnter(menuName)}
            className={`rounded px-3 py-1.5 text-[14px] transition ${
              activeMenu === menuName
                ? "bg-[#e8eaed] text-[#202124]"
                : "text-[#3c4043] hover:bg-[#e8eaed]"
            }`}
          >
            {menuName}
          </button>

          {activeMenu === menuName && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded bg-white py-1.5 shadow-[0_2px_6px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
              {menus[menuName].map((item, index) => {
                if (item.divider) {
                  return <div key={`divider-${index}`} className="my-1.5 h-px w-full bg-[#e8eaed]" />;
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.action();
                      setActiveMenu(null);
                    }}
                    className="flex w-full items-center justify-between px-4 py-1.5 text-left text-[14px] text-[#3c4043] hover:bg-[#f1f3f4]"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[12px] text-[#5f6368]">{item.shortcut}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
