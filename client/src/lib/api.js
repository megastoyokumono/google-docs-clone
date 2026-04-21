import { API_URL } from "./config";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let message = "Request failed";
    try {
      if (contentType.includes("application/json")) {
        const payload = await response.json();
        message = payload.error || message;
      } else {
        const text = await response.text();
        if (text.includes("<!doctype") || text.includes("<html")) {
          message = "API returned HTML instead of JSON. Make sure the backend server is running.";
        } else {
          message = text || response.statusText || message;
        }
      }
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    if (text.includes("<!doctype") || text.includes("<html")) {
      throw new Error("API returned HTML instead of JSON. Check the frontend API configuration.");
    }
    throw new Error("API returned an unexpected response format.");
  }

  return response.json();
}

export function listDocuments() {
  return request("/api/documents");
}

export function createDocument(payload) {
  return request("/api/documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDocument(documentId) {
  return request(`/api/documents/${documentId}`);
}

export function saveDocument(documentId, payload) {
  return request(`/api/documents/${documentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function saveDocumentImmediately(documentId, payload) {
  return fetch(`${API_URL}/api/documents/${documentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  });
}
