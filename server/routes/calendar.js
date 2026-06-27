import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { fetchEvents, createCalendarEvent } from '../services/calendarService.js';

const router = express.Router();

// Retrieve calendar events for the upcoming 7 days
router.get('/events', protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    const events = await fetchEvents(req.user, start, end);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync task to Google Calendar
router.post('/sync', protect, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;
    
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required calendar fields: title, startTime, endTime." });
    }

    const event = await createCalendarEvent(req.user, {
      summary: title,
      description: description || "Scheduled via Last-Minute Life Saver productivity companion.",
      startTime,
      endTime
    });

    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
