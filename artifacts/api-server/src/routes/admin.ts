import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminTable } from "@workspace/db";
import {
  ChangeAdminPasswordBody,
  GetAdminStatusResponse,
  LoginAdminBody,
  LoginAdminResponse,
  SetupAdminBody,
  SetupAdminResponse,
} from "@workspace/api-zod";
import {
  clearSessions,
  createPasswordRecord,
  endSession,
  getAdmin,
  isAuthenticated,
  passwordMatches,
  requireAdmin,
  startSession,
} from "../lib/admin-auth";

const router: IRouter = Router();

async function status() {
  const admin = await getAdmin();
  return { configured: Boolean(admin), authenticated: false };
}

router.get("/admin/status", async (req, res): Promise<void> => {
  const current = await status();
  res.json(GetAdminStatusResponse.parse({ ...current, authenticated: isAuthenticated(req) }));
});

router.post("/admin/setup", async (req, res): Promise<void> => {
  const parsed = SetupAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (await getAdmin()) {
    res.status(409).json({ error: "Admin is already configured" });
    return;
  }

  const password = createPasswordRecord(parsed.data.password);
  await db.insert(adminTable).values(password);
  startSession(res);
  res.status(201).json(SetupAdminResponse.parse({ configured: true, authenticated: true }));
});

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = LoginAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const admin = await getAdmin();
  if (!admin || !passwordMatches(parsed.data.password, admin.passwordHash, admin.passwordSalt)) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  startSession(res);
  res.json(LoginAdminResponse.parse({ configured: true, authenticated: true }));
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  endSession(req, res);
  res.sendStatus(204);
});

router.patch("/admin/password", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ChangeAdminPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const admin = await getAdmin();
  if (!admin || !passwordMatches(parsed.data.current_password, admin.passwordHash, admin.passwordSalt)) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const password = createPasswordRecord(parsed.data.new_password);
  await db.update(adminTable).set({ ...password, updatedAt: new Date() }).where(eq(adminTable.id, admin.id));
  clearSessions();
  startSession(res);
  res.sendStatus(204);
});

export default router;