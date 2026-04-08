const express = require('express');
const router = express.Router();
const sequelize = require('../config/db');
const authMiddleware = require('../middlewares/auth.middleware');

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { username, bio, avatar } = req.body;

    // Validate input
    if (username && username.length > 20) {
      return res.status(400).json({ message: 'Username must be 20 characters or less' });
    }

    if (bio && bio.length > 100) {
      return res.status(400).json({ message: 'Bio must be 100 characters or less' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (avatar) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(userId);

    // Update user
    await sequelize.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      { replacements: values }
    );

    // Fetch updated user
    const [[user]] = await sequelize.query(
      'SELECT id, username, email, bio, avatar, rating FROM users WHERE id = ?',
      { replacements: [userId] }
    );

    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const [[user]] = await sequelize.query(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.bio, 
        u.avatar, 
        u.rating,
        COUNT(DISTINCT mr.match_id) as totalMatches,
        SUM(CASE WHEN mr.result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN mr.result = 'loss' THEN 1 ELSE 0 END) as losses
      FROM users u
      LEFT JOIN match_results mr ON u.id = mr.user_id
      WHERE u.id = ?
      GROUP BY u.id`,
      { replacements: [userId] }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

module.exports = router;
