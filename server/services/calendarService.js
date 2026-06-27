import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

let isGoogleConfigured = false;
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  isGoogleConfigured = true;
}

const createOAuthClient = (accessToken, refreshToken) => {
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  return client;
};

// Return realistic mock events for demo UI
const getMockEvents = () => {
  const today = new Date();
  const getOffsetDate = (offsetDays, hour) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: "mock-ev-1",
      summary: "Daily Team Standup 👥",
      description: "Sync with developer team on sprint goals.",
      start: { dateTime: getOffsetDate(0, 10) },
      end: { dateTime: getOffsetDate(0, 10.5) },
      colorId: "1"
    },
    {
      id: "mock-ev-2",
      summary: "Lunch with Client 🍕",
      description: "Discuss design review and deadline priorities.",
      start: { dateTime: getOffsetDate(0, 13) },
      end: { dateTime: getOffsetDate(0, 14) },
      colorId: "2"
    },
    {
      id: "mock-ev-3",
      summary: "Project Architecture Review 🛠️",
      description: "Deep-dive into component diagrams and schemas.",
      start: { dateTime: getOffsetDate(1, 14) },
      end: { dateTime: getOffsetDate(1, 16) },
      colorId: "5"
    },
    {
      id: "mock-ev-4",
      summary: "Product Demo & Sync 🚀",
      description: "Show off the new glassmorphism landing pages.",
      start: { dateTime: getOffsetDate(3, 11) },
      end: { dateTime: getOffsetDate(3, 12) },
      colorId: "9"
    },
    {
      id: "mock-ev-5",
      summary: "Dentist Appointment 🩺",
      description: "Routine dental checkup.",
      start: { dateTime: getOffsetDate(-1, 15) },
      end: { dateTime: getOffsetDate(-1, 16) },
      colorId: "11"
    }
  ];
};

export async function fetchEvents(user, timeMin, timeMax) {
  if (!isGoogleConfigured || !user.google_access_token) {
    console.log("Google Calendar API is not configured or user is not connected. Returning mock events.");
    return getMockEvents();
  }

  try {
    const authClient = createOAuthClient(user.google_access_token, user.google_refresh_token);
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error.message);
    return getMockEvents(); // Safe fallback
  }
}

export async function createCalendarEvent(user, eventDetails) {
  if (!isGoogleConfigured || !user.google_access_token) {
    console.log("Google Calendar client not active. Simulating event insertion.");
    return {
      id: `mock-inserted-${Math.random().toString(36).substring(7)}`,
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: { dateTime: eventDetails.startTime },
      end: { dateTime: eventDetails.endTime },
      status: "confirmed"
    };
  }

  try {
    const authClient = createOAuthClient(user.google_access_token, user.google_refresh_token);
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: { dateTime: eventDetails.startTime },
        end: { dateTime: eventDetails.endTime },
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error.message);
    throw error;
  }
}
