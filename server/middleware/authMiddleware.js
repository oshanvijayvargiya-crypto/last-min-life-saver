import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-life-saver';

export const protect = async (req, res, next) => {
  let token = req.cookies?.token;

  // Support authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Support Mock auth header or cookie directly for easy testing
  const mockUserId = req.headers['x-mock-user-id'] || req.cookies?.mock_user_id;

  if (!token && mockUserId) {
    try {
      const { data: users } = await supabase.from('users').select('*').eq('id', mockUserId);
      if (users && users.length > 0) {
        req.user = users[0];
        return next();
      } else {
        // Auto-provision a mock user if they don't exist
        const newUser = {
          id: mockUserId,
          email: 'rahul.mock@gmail.com',
          name: 'Rahul Kumar',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rahul',
          streak_count: 3,
          longest_streak: 7,
          total_tasks_completed: 8,
          xp_points: 120,
          work_hours_start: '09:00:00',
          work_hours_end: '17:00:00',
          productivity_style: 'Deep Work'
        };
        await supabase.from('users').insert(newUser);
        req.user = newUser;
        return next();
      }
    } catch (err) {
      console.error("Error setting up mock user session:", err.message);
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, session token is missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { data: users, error } = await supabase.from('users').select('*').eq('id', decoded.id);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: "Not authorized, user profile not found." });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: "Not authorized, session token is invalid or expired." });
  }
};
