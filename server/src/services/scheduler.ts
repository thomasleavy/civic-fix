import { sendWeeklySummariesToAllUsers } from './emailService';

// Simple scheduler for weekly email summaries
// In production, you might want to use a proper job scheduler like node-cron or Bull

let weeklySummaryInterval: NodeJS.Timeout | null = null;
let messageAutoCloseInterval: NodeJS.Timeout | null = null;

// Calculate milliseconds until next Monday at 9 AM
const getMsUntilNextMonday = (): number => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0); // 9 AM
  
  // If it's already past 9 AM on Monday, schedule for next Monday
  if (dayOfWeek === 1 && now.getHours() >= 9) {
    nextMonday.setDate(nextMonday.getDate() + 7);
  }
  
  return nextMonday.getTime() - now.getTime();
};

// Schedule weekly summaries
export const startWeeklySummaryScheduler = (): void => {
  if (weeklySummaryInterval) {
    console.log('📧 Weekly summary scheduler already running');
    return;
  }

  const scheduleNext = () => {
    const msUntilNext = getMsUntilNextMonday();
    const nextDate = new Date(Date.now() + msUntilNext);
    
    console.log(`📧 Weekly summary scheduled for: ${nextDate.toLocaleString()}`);
    
    weeklySummaryInterval = setTimeout(async () => {
      console.log('📧 Running weekly summary job...');
      await sendWeeklySummariesToAllUsers();
      
      // Schedule next week
      scheduleNext();
    }, msUntilNext);
  };

  // Start scheduling
  scheduleNext();
  
  console.log('✅ Weekly summary scheduler started');
};

// Stop the scheduler
export const stopWeeklySummaryScheduler = (): void => {
  if (weeklySummaryInterval) {
    clearTimeout(weeklySummaryInterval);
    weeklySummaryInterval = null;
    console.log('📧 Weekly summary scheduler stopped');
  }
};

// Manual trigger for testing (can be called via API endpoint)
export const triggerWeeklySummary = async (): Promise<void> => {
  console.log('📧 Manually triggering weekly summary...');
  await sendWeeklySummariesToAllUsers();
};

// Start scheduler to auto-close resolved messages after 48 hours
export const startMessageAutoCloseScheduler = (): void => {
  if (messageAutoCloseInterval) {
    console.log('📬 Message auto-close scheduler already running');
    return;
  }

  // Run every hour (3600000 ms)
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  const runAutoClose = async () => {
    try {
      // Dynamically import to avoid circular dependencies
      const { closeOldResolvedMessages } = await import('../controllers/adminMessagesController');
      await closeOldResolvedMessages();
    } catch (error: any) {
      console.error('❌ Error in message auto-close scheduler:', error.message);
    }
  };

  // Run immediately on start, then every hour
  runAutoClose();
  messageAutoCloseInterval = setInterval(runAutoClose, INTERVAL_MS);

  console.log('✅ Message auto-close scheduler started (runs every hour)');
};

// Stop the message auto-close scheduler
export const stopMessageAutoCloseScheduler = (): void => {
  if (messageAutoCloseInterval) {
    clearInterval(messageAutoCloseInterval);
    messageAutoCloseInterval = null;
    console.log('📬 Message auto-close scheduler stopped');
  }
};
