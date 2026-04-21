function getDefaultApiUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  return window.location.origin;
}

function getDefaultWsUrl() {
  if (typeof window === "undefined") {
    return "ws://localhost:3001";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

export const API_URL = import.meta.env.VITE_API_URL || getDefaultApiUrl();
export const WS_URL = import.meta.env.VITE_WS_URL || getDefaultWsUrl();
