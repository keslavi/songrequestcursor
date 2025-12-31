import Router from '@koa/router';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const router = new Router();

// Return limited public profile info for performer display
router.get('/:id', async (ctx) => {
  const { id } = ctx.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    ctx.status = 400;
    ctx.body = { message: 'Invalid user id' };
    return;
  }

  try {
    const user = await User.findById(id).select('_id profile role');

    if (!user) {
      ctx.status = 404;
      ctx.body = { message: 'User not found' };
      return;
    }

    ctx.body = {
      _id: user._id,
      role: user.role,
      profile: {
        name: user.profile?.name || '',
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        stageName: user.profile?.stageName || ''
      }
    };
  } catch (error) {
    console.error('Error fetching public user profile:', error);
    ctx.status = 500;
    ctx.body = { message: 'Failed to load user profile' };
  }
});

export default router;
