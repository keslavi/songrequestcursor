import Router from '@koa/router';
import { authenticateToken } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = new Router({ prefix: '/api/users' });

// Get performers (users who are not 'user' or 'guest')
router.get('/performers', authenticateToken, async (ctx) => {
  try {
    const performers = await User.find({
      role: { $nin: ['user', 'guest'] }
    })
    .select('_id profile role')
    .sort({ 'profile.name': 1 });

    ctx.body = performers.map(user => ({
      key: user._id.toString(),
      text: `${user.profile?.name || user.profile?.firstName || user.username || 'Unknown'} (${user.role})`
    }));
  } catch (error) {
    console.error('Error fetching performers:', error);
    ctx.status = 500;
    ctx.body = { message: 'Failed to fetch performers' };
  }
});

export default router; 