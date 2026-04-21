function statusStyles(status) {
  switch (status) {
    case "saved":
      return "text-[#188038]";
    case "saving":
      return "text-[#b06000]";
    case "error":
      return "text-[#d93025]";
    default:
      return "text-[#5f6368]";
  }
}

export default function SaveIndicator({ status, lastSavedAt }) {
  let text = "Ready";

  if (status === "saving") {
    text = "Saving changes...";
  } else if (status === "saved") {
    text = "All changes saved";
  } else if (status === "error") {
    text = "Save failed";
  } else if (lastSavedAt) {
    text = "Ready";
  }

  return <div className={`text-[13px] font-medium ${statusStyles(status)}`}>{text}</div>;
}
