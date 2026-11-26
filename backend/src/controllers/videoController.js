import Video from '../models/Video.js';
import VideoView from '../models/VideoView.js';

const toCamelCase = (obj) => {
  const camelObj = {};
  for (const key in obj) {
    if (key === '_id') continue;
    let camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (key === 'duration_seconds') camelKey = 'duration';
    if (key === 'video_url') camelKey = 'videoUrl';
    if (key === 'thumbnail_url') camelKey = 'thumbnail';
    if (key === 'reward_points') camelKey = 'rewardPoints';
    if (key === 'reward_amount') camelKey = 'rewardAmount';
    if (key === 'max_views') camelKey = 'maxViews';
    if (key === 'current_views') camelKey = 'currentViews';
    if (key === 'watch_duration') camelKey = 'watchDuration';
    if (key === 'earned_points') camelKey = 'earnedPoints';
    if (key === 'earned_amount') camelKey = 'earnedAmount';
    if (key === 'user_id') camelKey = 'userId';
    if (key === 'video_id') camelKey = 'videoId';
    if (key === 'created_at') camelKey = 'createdAt';
    if (key === 'updated_at') camelKey = 'updatedAt';
    if (key === 'is_active') camelKey = 'isActive';
    if (key === 'account_type') camelKey = 'accountType';
    if (key === 'referred_by') camelKey = 'referredBy';
    if (key === 'phone_number') camelKey = 'phoneNumber';
    if (key === 'password_hash') continue;
    if (key === 'referral_code') camelKey = 'referralCode';
    if (key === 'total_earned') camelKey = 'totalEarned';
    if (key === 'total_withdrawn') camelKey = 'totalWithdrawn';
    if (key === 'payment_method') camelKey = 'paymentMethod';
    if (key === 'processed_by') camelKey = 'processedBy';
    if (key === 'referee_id') camelKey = 'refereeId';
    if (key === 'referrer_id') camelKey = 'referrerId';
    if (key === 'level') camelKey = 'level';
    if (key === 'points_earned') camelKey = 'pointsEarned';
    if (key === 'amount_earned') camelKey = 'amountEarned';
    camelObj[camelKey] = obj[key];
  }
  return camelObj;
};

const toCamelCaseArray = (arr) => arr.map(toCamelCase);

export const getAllVideos = async (req, res) => {
  try {
    const rawPage = Number(req.query.page || 1);
    const rawLimit = Number(req.query.limit || 12);
    const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1;
    const limit = Number.isSafeInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 12;
    const category = typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 50) || null : null;

    const videos = await Video.findAll(page, limit, category);
    const watchedIds = await VideoView.getWatchedVideoIds(req.user.id, videos.map((video) => video.id));
    const watchedSet = new Set(watchedIds);
    const videosWithStatus = videos.map((video) => ({
      ...toCamelCase(video),
      userWatched: watchedSet.has(Number(video.id)),
    }));

    res.json(videosWithStatus);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const hasWatched = await VideoView.hasWatched(req.user.id, video.id);
    res.json({ ...toCamelCase(video), userWatched: hasWatched });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Legacy client-timed reward claims are intentionally disabled. Rewards are
// now issued only by videoWatchController after a server-timed watch session.
export const watchVideo = async (req, res) => res.status(410).json({
  error: 'Client-reported watch duration is no longer accepted. Start a server-timed watch session.',
  code: 'WATCH_SESSION_REQUIRED',
});

export const getWatchHistory = async (req, res) => {
  try {
    const history = await VideoView.getUserViews(req.user.id);
    res.json(toCamelCaseArray(history));
  } catch (error) {
    console.error('Get watch history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
