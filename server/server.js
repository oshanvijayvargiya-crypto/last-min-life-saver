import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import passport from 'passport';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import goalRoutes from './routes/goals.js';
import aiRoutes from './routes/ai.js';
import calendarRoutes from './routes/calendar.js';

// Import Database & protect middleware
import { protect } from './middleware/authMiddleware.js';
import { supabase } from './db/supabaseClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Express Midlewares
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());

// Setup Health Route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Map Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/goals', goalRoutes);
app.use('/ai', aiRoutes);
app.use('/calendar', calendarRoutes);

// User settings route
app.put('/users/settings', protect, async (req, res) => {
  try {
    const { work_hours_start, work_hours_end, productivity_style } = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update({
        work_hours_start: work_hours_start || req.user.work_hours_start,
        work_hours_end: work_hours_end || req.user.work_hours_end,
        productivity_style: productivity_style || req.user.productivity_style
      })
      .eq('id', req.user.id)
      .select();

    if (error) throw error;
    res.json({ success: true, message: "Settings updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback Route Handler
app.use((req, res) => {
  res.status(404).json({ error: "API Endpoint not found" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Last-Minute Life Saver server listening on port ${PORT}`);
  console.log(`👉 Environment configuration loaded. Base API available at http://localhost:${PORT}`);
});
