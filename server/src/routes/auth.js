import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { createUser, getUserByUsername } from "../db/authRepository.js";

const router = Router();
const SALT_ROUNDS = 10;

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6).max(128),
});

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (request, response) => {
  const parsed = credentialsSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
  }

  const { username, password } = parsed.data;

  if (getUserByUsername(username)) {
    return response.status(409).json({ error: "Username is already taken" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = createUser({ username, passwordHash });
  const token = signToken(user);

  return response.status(201).json({ token, user: { id: user.id, username: user.username } });
});

router.post("/login", async (request, response) => {
  const parsed = credentialsSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid username or password" });
  }

  const { username, password } = parsed.data;
  const user = getUserByUsername(username);

  if (!user) {
    return response.status(401).json({ error: "Invalid username or password" });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return response.status(401).json({ error: "Invalid username or password" });
  }

  const token = signToken(user);
  return response.json({ token, user: { id: user.id, username: user.username } });
});

router.get("/me", (request, response) => {
  const authHeader = request.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return response.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return response.json({ id: payload.sub, username: payload.username });
  } catch {
    return response.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
