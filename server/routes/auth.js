import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabaseClient.js';
import { protect } from '../middleware/authMiddleware.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-life-saver';
const CLIENT_URL = 'http://localhost:5173'; // Default Vite client dev server

let isGoogleConfigured = false;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  isGoogleConfigured = true;
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const avatar_url = profile.photos[0]?.value;
      const google_id = profile.id;

      // Check if user already exists
      const { data: existingUsers } = await supabase.from('users').select('*').eq('email', email);
      let user;

      if (existingUsers && existingUsers.length > 0) {
        user = existingUsers[0];
        // Sync new tokens and avatar updates
        const { data: updatedUsers } = await supabase.from('users').update({
          google_id,
          avatar_url,
          google_access_token: accessToken,
          google_refresh_token: refreshToken
        }).eq('id', user.id);
        
        user.google_access_token = accessToken;
        user.google_refresh_token = refreshToken;
      } else {
        // Create user
        const { data: insertedUsers, error: insertError } = await supabase.from('users').insert({
          google_id,
          email,
          name,
          avatar_url,
          google_access_token: accessToken,
          google_refresh_token: refreshToken,
          streak_count: 1,
          longest_streak: 1,
          total_tasks_completed: 0,
          xp_points: 10, // Start with a signup bonus!
          work_hours_start: '09:00:00',
          work_hours_end: '17:00:00',
          productivity_style: 'Deep Work'
        }).select();
        
        if (insertError) {
          console.error("Supabase user insert error:", insertError.message);
          throw insertError;
        }
        
        user = Array.isArray(insertedUsers) ? insertedUsers[0] : insertedUsers;
      }

      return done(null, user);
    } catch (err) {
      console.error("Google passport verification error:", err.message);
      return done(err, null);
    }
  }));
}

// Get user profile
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// OAuth initiate endpoint
router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured) {
    console.warn("Google OAuth Client ID/Secret missing. Falling back to local Mock Login.");
    return res.redirect('/auth/mock-login');
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

// OAuth callback endpoint
router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured) {
    return res.redirect('/auth/mock-login');
  }
  passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}/?error=oauth_failed` }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${CLIENT_URL}/?error=auth_failed`);
    }
    
    // Issue token cookie
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in prod
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.redirect(`${CLIENT_URL}/dashboard?token=${token}`);
  })(req, res, next);
});

// Direct Mock Login for keyless configuration
router.get('/mock-login', (req, res) => {
  const mockUserId = '8c33e8ec-4c39-4055-8b33-8e4ec9a6e058'; // Statically mapped mock user
  
  res.cookie('mock_user_id', mockUserId, {
    httpOnly: false, // accessible via JS to enable auth store hydration
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.redirect(`${CLIENT_URL}/dashboard`);
});

// Log out endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('mock_user_id');
  res.json({ success: true, message: "Successfully logged out." });
});

export default router;
