import Router from '@koa/router';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const normalizeString = (value) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const applyVenmoHandleFormat = (handle) => {
  const normalized = normalizeString(handle);
  if (!normalized) return undefined;
  if (normalized.startsWith('@')) return normalized;
  return `@${normalized}`;
};

const router = new Router({ prefix: '/api' });

// Protected route - requires authentication
router.get('/profile', authenticateToken, async (ctx) => {
  ctx.body = (ctx.user || ctx.state.user).toProfile();
});

// Admin route - requires authentication and admin role
router.get('/admin', authenticateToken, requireAdmin, async (ctx) => {
  ctx.body = {
    message: 'Admin access granted',
    user: ctx.user.toProfile()
  };
});

router.put('/profile', authenticateToken, async (ctx) => {
  const user = ctx.state.user;

  if (!user) {
    ctx.status = 401;
    ctx.body = { message: 'User not found' };
    return;
  }

  const payload = ctx.request.body || {};
  const source = (payload.profile && typeof payload.profile === 'object')
    ? payload.profile
    : payload;

  user.profile = user.profile || {};

  if (Object.prototype.hasOwnProperty.call(source, 'stageName')) {
    const stageNameValue = normalizeString(source.stageName);
    if (stageNameValue) {
      user.profile.stageName = stageNameValue;
      user.profile.name = stageNameValue;
    } else {
      user.profile.stageName = undefined;
      user.profile.name = user.username;
    }
  }

  if (Object.prototype.hasOwnProperty.call(source, 'venmoHandle')) {
    const venmoHandleValue = applyVenmoHandleFormat(source.venmoHandle);
    user.profile.venmoHandle = venmoHandleValue || undefined;
  }

  if (source.venmoConfirmDigits !== undefined) {
    const digits = String(source.venmoConfirmDigits || '')
      .replace(/[^0-9]/g, '')
      .slice(-4);
    user.profile.venmoConfirmDigits = digits || undefined;
  }

  if (source.contactEmail !== undefined) {
    const contactEmail = normalizeString(source.contactEmail);
    user.profile.contactEmail = contactEmail ? contactEmail.toLowerCase() : undefined;
  }

  if (source.contactPhone !== undefined) {
    const phone = normalizeString(source.contactPhone);
    user.profile.contactPhone = phone;
  }

  if (source.description !== undefined) {
    const description = normalizeString(source.description);
    user.profile.description = description;
    user.profile.bio = description || undefined;
  }

  if (source.headshotUrl !== undefined) {
    const headshot = normalizeString(source.headshotUrl);
    user.profile.headshotUrl = headshot;
    user.profile.picture = headshot || undefined;
  }

  await user.save();

  ctx.state.user = user;
  ctx.user = user;
  ctx.body = user.toProfile();
});

export default router; 