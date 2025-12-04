import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendEventReminderEmail } from './email';

const prisma = new PrismaClient();

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  emailNotification?: boolean;
  notifyBefore?: number; // minutes before event
}

// Check for upcoming events and send notifications
const checkUpcomingEvents = async () => {
  try {
    // Get all documents with users
    const documents = await prisma.document.findMany({
      include: {
        user: true,
      },
    });

    const now = new Date();
    
    for (const doc of documents) {
      if (!doc.user?.email) continue;
      
      try {
        const content = doc.content.toString('utf-8');
        
        // Try to parse as JSON array (calendar events)
        let events: CalendarEvent[];
        try {
          events = JSON.parse(content);
          if (!Array.isArray(events)) continue; // Skip if not an array
        } catch {
          continue; // Skip if not valid JSON
        }
        
        for (const event of events) {
          // Skip if email notifications are disabled for this event
          if (event.emailNotification === false) continue;
          
          const eventStart = new Date(event.start);
          const timeUntilEvent = eventStart.getTime() - now.getTime();
          const minutesUntilEvent = timeUntilEvent / (1000 * 60);
          
          // Default: notify 24 hours (1440 minutes) before
          const notifyBefore = event.notifyBefore || 1440;
          
          // Check if we should send notification
          // Send if event is within notification window and hasn't started yet
          if (minutesUntilEvent > 0 && minutesUntilEvent <= notifyBefore && minutesUntilEvent > notifyBefore - 60) {
            await sendEventReminderEmail(
              doc.user.email,
              event.title,
              event.start,
              event.end
            );
            console.log(`Sent reminder for event: ${event.title} to ${doc.user.email}`);
          }
        }
      } catch (error) {
        // Skip documents that aren't calendar events
        continue;
      }
    }
  } catch (error) {
    console.error('Error checking upcoming events:', error);
  }
};

// Run every hour
export const startEventScheduler = () => {
  console.log('📧 Event notification scheduler started');
  
  // Run immediately on startup
  checkUpcomingEvents();
  
  // Schedule to run every hour
  cron.schedule('0 * * * *', () => {
    console.log('Running scheduled event check...');
    checkUpcomingEvents();
  });
};
