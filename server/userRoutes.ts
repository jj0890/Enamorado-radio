import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { db } from './db';
import { users, userProfiles, userAlbums, userContributions, insertUserContributionSchema } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireUser, requireModerator, optionalUser } from './userAuth';

const router = Router();
const upload = multer({ dest: '/tmp/avatars/', limits: { fileSize: 5 * 1024 * 1024 } });

// ─── /api/auth ────────────────────────────────────────────────────────────────
// (signup/login/logout/me are registered directly in routes.ts)

// ─── /api/user/profile ────────────────────────────────────────────────────────

router.get('/profile', requireUser, async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json({ user, profile });
});

router.patch('/profile', requireUser, async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const { displayName, bio, links, isPublic } = req.body;

  if (displayName) await db.update(users).set({ displayName, updatedAt: new Date() }).where(eq(users.id, userId));
  await db.update(userProfiles).set({
    ...(bio !== undefined && { bio }),
    ...(links !== undefined && { links }),
    ...(isPublic !== undefined && { isPublic }),
    updatedAt: new Date(),
  }).where(eq(userProfiles.userId, userId));

  res.json({ ok: true });
});

// ─── /api/user/avatar ─────────────────────────────────────────────────────────

router.post('/avatar', requireUser, upload.single('avatar'), async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  if (!req.file) return res.status(400).json({ error: 'no file' });

  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
  const dest = path.resolve('public', 'avatars', `pending_${userId}${ext}`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.rename(req.file.path, dest);

  await db.update(userProfiles).set({
    avatarUrl: `/avatars/pending_${userId}${ext}`,
    avatarStatus: 'pending',
    updatedAt: new Date(),
  }).where(eq(userProfiles.userId, userId));

  res.json({ ok: true, status: 'pending' });
});

// ─── /api/user/albums ─────────────────────────────────────────────────────────

router.get('/albums', requireUser, async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const albums = await db.select().from(userAlbums).where(eq(userAlbums.userId, userId));
  res.json({ albums });
});

router.put('/albums', requireUser, async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const { albums } = req.body as {
    albums: Array<{ rank: number; mbId: string; title: string; artist: string; year?: string; coverUrl?: string }>;
  };

  if (!Array.isArray(albums) || albums.length > 5) {
    return res.status(400).json({ error: 'provide 1-5 albums' });
  }

  await db.delete(userAlbums).where(eq(userAlbums.userId, userId));
  if (albums.length) {
    await db.insert(userAlbums).values(
      albums.map(a => ({ userId, rank: a.rank, mbId: a.mbId, title: a.title, artist: a.artist, year: a.year, coverUrl: a.coverUrl }))
    );
  }
  res.json({ ok: true });
});

// ─── /api/user/contributions ──────────────────────────────────────────────────

router.get('/contributions', requireUser, async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const contribs = await db.select().from(userContributions)
    .where(eq(userContributions.userId, userId))
    .orderBy(desc(userContributions.createdAt));
  res.json({ contributions: contribs });
});

router.post('/contributions', requireUser, async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  const parsed = insertUserContributionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const { type, title, url, isExternal, publishedAt } = parsed.data;
  const [contrib] = await db.insert(userContributions).values({
    userId, type, title,
    url: url ?? null,
    isExternal: isExternal ?? false,
    publishedAt: publishedAt ? new Date(publishedAt) : null,
    status: 'pending',
  }).returning();

  res.json({ ok: true, contribution: contrib });
});

router.delete('/contributions/:id', requireUser, async (req: Request, res: Response) => {
  const userId = (req as any).userId as number;
  await db.delete(userContributions)
    .where(and(eq(userContributions.id, Number(req.params.id)), eq(userContributions.userId, userId)));
  res.json({ ok: true });
});

// ─── Public profile pages /api/profiles/:handle ───────────────────────────────

router.get('/public/:handle', optionalUser, async (req: Request, res: Response) => {
  const [user] = await db.select({
    id: users.id, handle: users.handle, displayName: users.displayName,
    role: users.role, createdAt: users.createdAt,
  }).from(users).where(eq(users.handle, req.params.handle.toLowerCase())).limit(1);

  if (!user) return res.status(404).json({ error: 'not found' });

  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);
  if (profile && !profile.isPublic && (req as any).userId !== user.id) {
    return res.status(404).json({ error: 'not found' });
  }

  const albums = await db.select().from(userAlbums).where(eq(userAlbums.userId, user.id));
  const contribs = await db.select().from(userContributions)
    .where(and(eq(userContributions.userId, user.id), eq(userContributions.status, 'approved')))
    .orderBy(desc(userContributions.createdAt));

  res.json({ user, profile, albums, contributions: contribs });
});

// ─── Admin moderation /api/admin/community ────────────────────────────────────

router.get('/admin/users', requireModerator, async (_req: Request, res: Response) => {
  const allUsers = await db.select({
    id: users.id, handle: users.handle, displayName: users.displayName,
    email: users.email, role: users.role, createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt));
  res.json({ users: allUsers });
});

router.patch('/admin/users/:id/role', requireModerator, async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['member', 'moderator'].includes(role)) return res.status(400).json({ error: 'invalid role' });
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, Number(req.params.id)));
  res.json({ ok: true });
});

router.get('/admin/contributions', requireModerator, async (_req: Request, res: Response) => {
  const contribs = await db.select().from(userContributions).orderBy(desc(userContributions.createdAt));
  res.json({ contributions: contribs });
});

router.post('/admin/contributions/:id/approve', requireModerator, async (req: Request, res: Response) => {
  const approver = (req as any).userId;
  await db.update(userContributions).set({
    status: 'approved',
    approvedBy: String(approver),
    approvedAt: new Date(),
  }).where(eq(userContributions.id, Number(req.params.id)));
  res.json({ ok: true });
});

router.post('/admin/contributions/:id/reject', requireModerator, async (req: Request, res: Response) => {
  await db.update(userContributions).set({ status: 'rejected' })
    .where(eq(userContributions.id, Number(req.params.id)));
  res.json({ ok: true });
});

router.post('/admin/avatars/:userId/approve', requireModerator, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, Number(userId))).limit(1);
  if (!profile) return res.status(404).json({ error: 'not found' });

  if (profile.avatarUrl?.includes('pending_')) {
    const approved = profile.avatarUrl.replace('pending_', 'avatar_');
    await fs.rename(
      path.resolve('public', profile.avatarUrl.slice(1)),
      path.resolve('public', approved.slice(1))
    ).catch(() => {});
    await db.update(userProfiles).set({ avatarUrl: approved, avatarStatus: 'approved', updatedAt: new Date() })
      .where(eq(userProfiles.userId, Number(userId)));
  }
  res.json({ ok: true });
});

router.post('/admin/avatars/:userId/reject', requireModerator, async (req: Request, res: Response) => {
  await db.update(userProfiles).set({ avatarStatus: 'rejected', updatedAt: new Date() })
    .where(eq(userProfiles.userId, Number(req.params.userId)));
  res.json({ ok: true });
});

export default router;
