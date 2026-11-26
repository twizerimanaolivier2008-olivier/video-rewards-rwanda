import express from 'express';
const router = express.Router();
import { getAllVideos, getVideoById, getWatchHistory } from '../controllers/videoController.js';
import {
  startWatchSession,
  recordWatchProgress,
  completeWatchSession,
} from '../controllers/videoWatchController.js';
import { rateLimit } from '../middleware/rateLimit.js';

router.get('/history', getWatchHistory);
router.get('/', getAllVideos);
router.post('/:id/watch/start', rateLimit({ scope: 'video:watch:start', limit: 30, windowSeconds: 60 }), startWatchSession);
router.post('/:id/watch/progress', rateLimit({ scope: 'video:watch:progress', limit: 20, windowSeconds: 60 }), recordWatchProgress);
router.post('/:id/watch/complete', rateLimit({ scope: 'video:watch:complete', limit: 5, windowSeconds: 60 }), completeWatchSession);
router.post('/:id/watch', (req, res) => res.status(410).json({
  error: 'Client-reported watch duration is no longer accepted. Start a server-timed watch session.',
  code: 'WATCH_SESSION_REQUIRED',
}));
router.get('/:id', getVideoById);

export default router;
