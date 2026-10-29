import express from 'express';
const router = express.Router();
import { getAllVideos, getVideoById, watchVideo, getWatchHistory } from '../controllers/videoController.js';

router.get('/', getAllVideos);
router.get('/:id', getVideoById);
router.post('/:id/watch', watchVideo);
router.get('/history', getWatchHistory);

export default router;
