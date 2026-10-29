import Video from '../models/Video.js';
import VideoView from '../models/VideoView.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category || null;

    const videos = await Video.findAll(page, limit, category);
    const userId = req.user?.id;

    const videosWithStatus = await Promise.all(
      videos.map(async (video) => {
        const hasWatched = await VideoView.hasWatched(userId, video.id);
        return { ...toCamelCase(video), userWatched: hasWatched };
      })
    );

    res.json(toCamelCaseArray(videosWithStatus));
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

export const watchVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;
    const watchDuration = parseInt(req.body.watch_duration) || 0;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const alreadyWatched = await VideoView.hasWatched(userId, videoId);
    if (alreadyWatched) {
      return res.status(400).json({ message: 'You have already watched this video' });
    }

    const watchPercentage = (watchDuration / video.duration_seconds) * 100;
    const minimumPercentage = 90;

    let earnedPoints = 0;
    let earnedAmount = 0.00;

    if (watchPercentage >= minimumPercentage) {
      earnedPoints = video.reward_points || 10;
      earnedAmount = parseFloat(video.reward_amount) || 0.00;

      await VideoView.create({
        user_id: userId,
        video_id: videoId,
        watch_duration: watchDuration,
        earned_points: earnedPoints,
        earned_amount: earnedAmount
      });

      if (earnedPoints > 0) {
        await User.updatePoints(userId, earnedPoints);
      }
      if (earnedAmount > 0) {
        await User.updateBalance(userId, earnedAmount);
      }

      await Transaction.create({
        user_id: userId,
        type: 'video_reward',
        amount: earnedAmount,
        description: `Reward for watching: ${video.title}`,
        status: 'completed'
      });

      await Video.incrementViews(videoId);
    } else {
      await VideoView.create({
        user_id: userId,
        video_id: videoId,
        watch_duration: watchDuration,
        earned_points: 0,
        earned_amount: 0.00
      });
    }

    res.json({
      message: 'Video watch recorded',
      watchPercentage: Math.round(watchPercentage),
      earnedPoints: earnedPoints,
      earnedAmount: earnedAmount,
      completed: watchPercentage >= minimumPercentage
    });
  } catch (error) {
    console.error('Watch video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWatchHistory = async (req, res) => {
  try {
    const history = await VideoView.getUserViews(req.user.id);
    res.json(toCamelCaseArray(history));
  } catch (error) {
    console.error('Get watch history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
