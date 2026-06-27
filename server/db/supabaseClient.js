import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseUrl.trim() !== '') {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Supabase client, falling back to mock database:", err.message);
    supabase = null;
  }
}

if (!supabase) {
  console.warn("⚠️  WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing/invalid. Falling back to an in-memory database simulator.");
  
  // In-memory Database Store
  const memoryDb = {
    users: [],
    tasks: [],
    goals: [],
    milestones: [],
    habits: [],
    habit_logs: [],
    ai_conversations: []
  };

  // Helper to deep clone objects to prevent shared reference mutations
  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  const mockQueryBuilder = (tableName) => {
    let filters = [];

    const builder = {
      select: (fields) => {
        return builder;
      },
      eq: (column, value) => {
        filters.push({ column, value });
        return builder;
      },
      order: (column, { ascending = true } = {}) => {
        // We will sort during final resolution
        return builder;
      },
      insert: async (payload) => {
        const records = Array.isArray(payload) ? payload : [payload];
        const newRecords = records.map(r => ({
          id: r.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...r
        }));
        if (!memoryDb[tableName]) {
          memoryDb[tableName] = [];
        }
        memoryDb[tableName].push(...clone(newRecords));
        return { data: Array.isArray(payload) ? clone(newRecords) : clone(newRecords[0]), error: null };
      },
      update: async (payload) => {
        if (!memoryDb[tableName]) memoryDb[tableName] = [];
        const matched = memoryDb[tableName].filter(item => {
          return filters.every(f => item[f.column] === f.value);
        });
        matched.forEach(item => {
          Object.assign(item, payload);
        });
        return { data: clone(matched), error: null };
      },
      delete: async () => {
        if (!memoryDb[tableName]) memoryDb[tableName] = [];
        const matched = memoryDb[tableName].filter(item => {
          return filters.every(f => item[f.column] === f.value);
        });
        memoryDb[tableName] = memoryDb[tableName].filter(item => !matched.includes(item));
        return { data: clone(matched), error: null };
      },
      // support .then for async/await behavior on standard selections
      then: (onfulfilled) => {
        let list = memoryDb[tableName] || [];
        if (filters.length > 0) {
          list = list.filter(item => {
            return filters.every(f => item[f.column] === f.value);
          });
        }
        const response = { data: clone(list), error: null };
        return Promise.resolve(response).then(onfulfilled);
      }
    };
    return builder;
  };

  supabase = {
    from: (tableName) => mockQueryBuilder(tableName),
    channel: () => ({
      on: () => ({
        subscribe: () => {}
      })
    })
  };
}

export { supabase };
