import pool from '../config/db.js';
import ReferralEarning from '../models/ReferralEarning.js';
import User from '../models/User.js';

export const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await ReferralEarning.getReferralStats(userId);
    const byLevel = await ReferralEarning.getReferralsByLevel(userId);

    const level1Count = byLevel.find(l => l.level === 1)?.count || 0;
    const level2Count = byLevel.find(l => l.level === 2)?.count || 0;
    const level1Earnings = byLevel.find(l => l.level === 1)?.amount || 0;
    const level2Earnings = byLevel.find(l => l.level === 2)?.amount || 0;

    res.json({
      totalReferrals: stats.total_referrals,
      totalReferralEarnings: stats.total_earned || 0,
      level1Count,
      level2Count,
      level1Earnings,
      level2Earnings,
      referral_code: req.user.referral_code
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReferralList = async (req, res) => {
  try {
    const userId = req.user.id;
    const earnings = await ReferralEarning.findByReferrerId(userId);

    const referees = await Promise.all(
      earnings.map(async (earning) => {
        const referee = await User.findById(earning.referee_id);
        if (!referee) return null;
        const { password_hash, ...refereeWithoutPassword } = referee;
        return {
          ...refereeWithoutPassword,
          name: `${referee.first_name} ${referee.last_name}`,
          phone: referee.phone_number,
          level: earning.level,
          points_earned: earning.points_earned,
          amount_earned: earning.amount_earned,
          date: earning.created_at
        };
      })
    );

    res.json(referees.filter(Boolean));
  } catch (error) {
    console.error('Referral list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ code: user.referral_code });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const generateReferralCode = async (req, res) => {
  try {
    const newCode = 'VR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await pool.query('UPDATE users SET referral_code = ? WHERE id = ?', [newCode, req.user.id]);
    res.json({ code: newCode });
  } catch (error) {
    console.error('Generate referral code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
