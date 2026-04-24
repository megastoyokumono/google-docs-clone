import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function authenticate(request, response, next) {
  const authHeader = request.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return response.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    request.user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    return response.status(401).json({ error: "Invalid or expired token" });
  }
}
