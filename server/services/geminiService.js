import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

// Safe JSON parser helper
function extractJson(text) {
  try {
    // Look for JSON block markers ```json ... ```
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    const raw = match ? match[1] : text;
    return JSON.parse(raw.trim());
  } catch (e) {
    console.error("Failed to parse AI JSON response, returning raw text or attempting repair:", e.message);
    // Regex attempt to find the first '{' and last '}'
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end + 1));
      }
    } catch (innerErr) {
      console.error("Secondary JSON repair failed:", innerErr.message);
    }
    throw new Error("Invalid JSON structure returned by Gemini");
  }
}

// Call Gemini API helper
async function callGemini(prompt) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY' || GEMINI_API_KEY.trim() === '') {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (HTTP ${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error("Empty response from Gemini API");
  }
  return textResponse;
}

/* ==========================================
   AI Core Implementations
   ========================================== */

export async function analyzeAndPrioritizeTasks(tasks) {
  try {
    const prompt = `
You are a task analysis assistant. Analyze and prioritize the following tasks.
Return a JSON array of objects, one for each task. Each object MUST contain:
- id: (the task's original ID)
- priority_score: integer from 1 to 100
- urgency_level: string: 'P1', 'P2', 'P3', or 'P4' (P1 is highest, P4 is lowest)
- suggested_time_slot: an ISO string suggesting when to work on this, or null
- reason_for_priority: brief single-sentence explanation of why it was prioritized

Tasks to analyze:
${JSON.stringify(tasks, null, 2)}

Provide ONLY a valid JSON array. Do not include markdown headers or explanatory text outside the JSON block.
`;

    const aiRes = await callGemini(prompt);
    return extractJson(aiRes);
  } catch (error) {
    console.warn("Using fallback local task prioritization:", error.message);
    // Local Priority Engine Fallback
    return tasks.map(task => {
      // Run the requested priority algorithm:
      // priority_score = (deadline_urgency * 0.4) + (importance_weight * 0.35) + (effort_inverse * 0.15) + (user_override * 0.10)
      let deadline_urgency = 20;
      if (task.deadline) {
        const hours = (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
        if (hours <= 0) deadline_urgency = 100;
        else if (hours < 6) deadline_urgency = 100;
        else if (hours < 24) deadline_urgency = 80;
        else if (hours < 72) deadline_urgency = 60;
        else if (hours < 168) deadline_urgency = 40;
      }
      
      const categoryWeights = { Work: 90, Study: 80, Finance: 70, Health: 60, Personal: 50 };
      const importance_weight = categoryWeights[task.category] || 50;

      const est = task.estimated_minutes || 30;
      const effort_inverse = Math.max(0, 100 - (est / 480) * 100);

      let override_val = 50;
      if (task.user_override === 'P1') override_val = 100;
      else if (task.user_override === 'P2') override_val = 75;
      else if (task.user_override === 'P3') override_val = 50;
      else if (task.user_override === 'P4') override_val = 25;

      const priority_score = Math.round(
        (deadline_urgency * 0.4) + 
        (importance_weight * 0.35) + 
        (effort_inverse * 0.15) + 
        (override_val * 0.10)
      );

      let urgency_level = 'P4';
      if (priority_score >= 80) urgency_level = 'P1';
      else if (priority_score >= 60) urgency_level = 'P2';
      else if (priority_score >= 40) urgency_level = 'P3';

      let suggested_time_slot = null;
      if (task.deadline) {
        const time = new Date(task.deadline);
        time.setHours(time.getHours() - 3); // suggested 3 hours before
        suggested_time_slot = time.toISOString();
      }

      return {
        id: task.id,
        priority_score,
        urgency_level,
        suggested_time_slot,
        reason_for_priority: `Prioritized automatically: category importance ${importance_weight}% and deadline urgency score ${Math.round(deadline_urgency)}%.`
      };
    });
  }
}

export async function generateDailyPlan(tasks, calendarEvents, userPreferences) {
  try {
    const prompt = `
Create an hour-by-hour daily schedule based on:
Tasks: ${JSON.stringify(tasks)}
Google Calendar Events: ${JSON.stringify(calendarEvents)}
User settings: Work hours ${userPreferences.work_hours_start} to ${userPreferences.work_hours_end}, Style: ${userPreferences.productivity_style}

Return a JSON object containing:
- plan_summary: A 2-3 sentence motivational overview of today's plan
- schedule: Array of timeline objects:
  * time: e.g. "09:00 AM"
  * duration: minutes
  * label: title of task, event, or break
  * type: "work" | "meeting" | "break" | "focus"
  * taskId: UUID of matching task, or null
- focus_blocks_count: number of focus blocks
- break_minutes_total: total minutes allocated for breaks

Provide ONLY valid JSON.
`;
    const aiRes = await callGemini(prompt);
    return extractJson(aiRes);
  } catch (error) {
    console.warn("Using fallback local daily planner:", error.message);
    
    // Fallback Planner logic
    const startHour = parseInt(userPreferences.work_hours_start?.split(':')[0] || '9', 10);
    const endHour = parseInt(userPreferences.work_hours_end?.split(':')[0] || '17', 10);
    const durationHours = endHour - startHour;

    const schedule = [];
    let focusBlocks = 0;
    let breakMin = 0;

    // Filter pending tasks
    const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 3);
    
    let currentHour = startHour;
    pendingTasks.forEach((task, index) => {
      if (currentHour >= endHour) return;
      
      schedule.push({
        time: `${currentHour.toString().padStart(2, '0')}:00 AM`,
        duration: task.estimated_minutes || 60,
        label: `Focus Block: ${task.title}`,
        type: "focus",
        taskId: task.id
      });
      focusBlocks++;
      currentHour += 1;

      // Add a break
      if (currentHour < endHour) {
        schedule.push({
          time: `${currentHour.toString().padStart(2, '0')}:00 AM`,
          duration: 15,
          label: "Rest & Rehydrate Break",
          type: "break",
          taskId: null
        });
        breakMin += 15;
      }
    });

    if (schedule.length === 0) {
      schedule.push({
        time: `${startHour.toString().padStart(2, '0')}:00 AM`,
        duration: 30,
        label: "Plan the day & review inbox",
        type: "work",
        taskId: null
      });
    }

    return {
      plan_summary: `Your day is balanced with ${focusBlocks} high-focus blocks and ${breakMin} minutes of resting space. Follow the block schedule to maximize your ${userPreferences.productivity_style || 'Flexible'} workflow.`,
      schedule,
      focus_blocks_count: focusBlocks,
      break_minutes_total: breakMin
    };
  }
}

export async function breakGoalIntoMilestones(goalTitle, targetDate) {
  try {
    const prompt = `
Break down the long term goal: "${goalTitle}" with target deadline date "${targetDate}" into milestones and habits.
Return a JSON object containing:
- milestones: Array of objects:
  * title: milestone name
  * target_date: ISO date string when this milestone should be complete
- habits: Array of strings representing daily or weekly habit names needed to hit this goal (e.g. "Read for 30 minutes")

Provide ONLY valid JSON.
`;
    const aiRes = await callGemini(prompt);
    return extractJson(aiRes);
  } catch (error) {
    console.warn("Using fallback goal milestone breaker:", error.message);
    const deadline = new Date(targetDate);
    const now = new Date();
    const diffTime = Math.abs(deadline - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const milestones = [
      {
        title: `Initial research and foundation setup for ${goalTitle}`,
        target_date: new Date(now.getTime() + (diffTime * 0.25)).toISOString()
      },
      {
        title: `Core implementation and first draft/prototype`,
        target_date: new Date(now.getTime() + (diffTime * 0.5)).toISOString()
      },
      {
        title: `Refining, testing, and final corrections`,
        target_date: new Date(now.getTime() + (diffTime * 0.85)).toISOString()
      },
      {
        title: `Goal completion: ${goalTitle}`,
        target_date: deadline.toISOString()
      }
    ];

    const habits = [
      `Dedicate 20 mins daily to: ${goalTitle}`,
      `Track progress and review milestones weekly`
    ];

    return { milestones, habits };
  }
}

export async function getProductivityCoaching(userMessage, taskContext, streakData) {
  try {
    const prompt = `
You are a witty, supportive, and action-oriented AI Productivity Coach.
The user message is: "${userMessage}"
Context:
Active Tasks: ${JSON.stringify(taskContext)}
Streak and Completed Metrics: ${JSON.stringify(streakData)}

Provide an actionable response. Be specific and empathetic.
Return a JSON object containing:
- message: Markdown formatted coaching response (2 paragraphs max)
- action_steps: Array of 3 specific, short action items the user can do right now

Provide ONLY valid JSON.
`;
    const aiRes = await callGemini(prompt);
    return extractJson(aiRes);
  } catch (error) {
    console.warn("Using fallback local coaching response:", error.message);

    const msgLower = userMessage.toLowerCase();
    let responseMessage = "";
    let actionSteps = [];

    if (msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("hey")) {
      responseMessage = `Hello! 👋 I'm your AI Productivity Coach. I'm here to help you defeat procrastination and crush your goals. What are we working on today? Let's take it one step at a time! \n\n*(Note: Your Gemini API Key has exceeded its free quota. I'm running on a smart local helper bot until you update your key!)*`;
      actionSteps = [
        "List your top 3 priority tasks for today.",
        "Clear your workspace and shut down distracting tabs.",
        "Type 'lazy' or 'stuck' if you need help starting a task!"
      ];
    } else if (msgLower.includes("lazy") || msgLower.includes("procrastinate") || msgLower.includes("stuck") || msgLower.includes("bored")) {
      responseMessage = `I hear you completely. Feeling lazy or stuck is usually just your brain resisting the friction of starting. Let's cheat that resistance: pick your absolute smallest task and agree to do it for just **2 minutes**. Once you break the inertia, the rest is easy!`;
      actionSteps = [
        "Select one task and work on it for exactly 2 minutes.",
        "Put your phone in another room or turn on Do Not Disturb.",
        "Take a sip of water and start the first step right now."
      ];
    } else if (msgLower.includes("overwhelm") || msgLower.includes("stressed") || msgLower.includes("too much") || msgLower.includes("anxious")) {
      responseMessage = `Take a deep breath. 🧘‍♂️ Overwhelm happens when we try to solve the whole project at once. Let's put everything else aside. What is the **one single step** we can do right now to move forward? Focus on that, and forget about the rest for the next 20 minutes.`;
      actionSteps = [
        "Pick the easiest sub-task to gain quick momentum.",
        "Write down a tiny 3-item checklist for the next hour.",
        "Inhale deeply for 4 seconds, hold for 4, exhale for 4."
      ];
    } else if (msgLower.includes("task") || msgLower.includes("work") || msgLower.includes("finish")) {
      responseMessage = `Let's get this done! 🚀 You have a current streak of **${streakData?.streak_count || 0} days**. Let's protect that streak at all costs. The best way to finish is to start with a Pomodoro sprint—25 minutes of deep focus, followed by a reward break.`;
      actionSteps = [
        "Start a Pomodoro timer (25 mins focus).",
        "Open only the tab/document required for this specific task.",
        "Commit to working without switching tabs until the timer rings."
      ];
    } else {
      responseMessage = `I understand. Let's tackle this together. Focus on the single smallest action step you can complete. You have a current streak of **${streakData?.streak_count || 0} days** with **${streakData?.xp_points || 0} XP**—let's keep that momentum going! \n\n*(Tip: If you want real Gemini AI responses, you can easily generate a new free API Key from Google AI Studio and update it in your Render settings!)*`;
      actionSteps = [
        "Pick your top task and set a timer for just 5 minutes of focused work.",
        "Clear your workspace of all distractions (put your phone away).",
        "Write down the immediate first step (e.g. open a document) and execute it now."
      ];
    }

    return {
      message: responseMessage,
      action_steps: actionSteps
    };
  }
}

export async function generateSmartReminder(task, hoursUntilDeadline) {
  try {
    const prompt = `
Create a context-aware smart notification prompt for task: "${task.title}" (category: ${task.category}) with ${hoursUntilDeadline} hours left.
Provide different tones depending on hours left:
- 168h (7 days): Planner nudge
- 72h (3 days): Preparation reminder (with sub-steps)
- 24h (1 day): Detailed final preparation checklist
- 3h: Urgent alert
- 1h: Critical emergency recovery

Return a JSON object containing:
- title: Brief alert header
- message: Motivational or urgent alert text
- action_text: A direct call-to-action button label

Provide ONLY valid JSON.
`;
    const aiRes = await callGemini(prompt);
    return extractJson(aiRes);
  } catch (error) {
    console.warn("Using fallback local smart reminder generator:", error.message);
    let title = "Time is Ticking ⏰";
    let message = `Your task "${task.title}" is coming up! Take a moment to review your notes.`;
    let action_text = "View Task";

    if (hoursUntilDeadline >= 160) {
      title = "Planning Nudge 🌱";
      message = `"${task.title}" is due in a week. AI suggests sketching out a basic draft or outline today.`;
      action_text = "Start Planning";
    } else if (hoursUntilDeadline >= 48) {
      title = "Preparation Reminder ⚡";
      message = `Only 3 days until "${task.title}" is due. Let's break this into manageable milestones.`;
      action_text = "Break It Down";
    } else if (hoursUntilDeadline >= 20) {
      title = "Final Prep Needed ⚠️";
      message = `Due tomorrow! Block out 45 minutes on your calendar for final adjustments.`;
      action_text = "Block Time";
    } else if (hoursUntilDeadline >= 2) {
      title = "URGENT ALERT 🚨";
      message = `"${task.title}" is due in less than 3 hours! Open your workspace and complete step 1 now.`;
      action_text = "Do It Now";
    } else if (hoursUntilDeadline >= 0) {
      title = "CRITICAL WARNING 🛑";
      message = `Emergency mode! 1 hour left for "${task.title}". Need to notify anyone or submit a draft? Let's finish!`;
      action_text = "Panic Mode";
    } else {
      title = "Recovery Plan 🩹";
      message = `"${task.title}" is past due. Let's reschedule it and save your streak!`;
      action_text = "Reschedule";
    }

    return { title, message, action_text };
  }
}

export async function analyzeWeeklyPerformance(completedTasks, missedTasks, habits) {
  try {
    const prompt = `
Analyze the weekly performance of the user:
Completed tasks: ${JSON.stringify(completedTasks)}
Missed/Overdue tasks: ${JSON.stringify(missedTasks)}
Habits progress: ${JSON.stringify(habits)}

Return a JSON object containing:
- performance_score: integer from 1 to 100
- patterns: Array of strings representing productivity patterns observed
- improvement_tips: Array of 3 actionable advice statements

Provide ONLY valid JSON.
`;
    const aiRes = await callGemini(prompt);
    return extractJson(aiRes);
  } catch (error) {
    console.warn("Using fallback weekly performance analyzer:", error.message);
    const complCount = completedTasks?.length || 0;
    const missedCount = missedTasks?.length || 0;
    const total = complCount + missedCount;
    const performance_score = total > 0 ? Math.round((complCount / total) * 100) : 80;

    return {
      performance_score,
      patterns: [
        `You completed ${complCount} tasks this week, maintaining a steady pace.`,
        missedCount > 0 ? `Struggled with deadlines for ${missedCount} tasks.` : "Excellent record of clean completions!",
        "Highest focus activity observed during morning hours."
      ],
      improvement_tips: [
        "Schedule tasks with estimated time >= 60 mins early in the day.",
        "Use 5-minute buffer breaks between focus blocks to avoid fatigue.",
        "Break down tasks that you find yourself rescheduling more than twice."
      ]
    };
  }
}
