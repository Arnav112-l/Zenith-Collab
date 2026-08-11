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
  reminderSentAt?: string;
}

// Check for upcoming events and send notifications
const checkUpcomingEvents = async () => {
  try {
    const documents = await prisma.document.findMany({
      where: { type: 'CALENDAR' },
      include: {
        user: true,
      },
    });

    const now = new Date();

    for (const doc of documents) {
      if (!doc.user?.email) continue;

      try {
        const content = doc.content.toString('utf-8');

        let events: CalendarEvent[];
        try {
          events = JSON.parse(content);
          if (!Array.isArray(events)) continue;
        } catch {
          continue;
        }

        let eventsChanged = false;

        for (const event of events) {
          if (event.emailNotification === false) continue;
          if (event.reminderSentAt) continue;

          const eventStart = new Date(event.start);
          const timeUntilEvent = eventStart.getTime() - now.getTime();
          const minutesUntilEvent = timeUntilEvent / (1000 * 60);

          const notifyBefore = event.notifyBefore || 1440;

          if (minutesUntilEvent > 0 && minutesUntilEvent <= notifyBefore && minutesUntilEvent > notifyBefore - 60) {
            await sendEventReminderEmail(
              doc.user.email,
              event.title || 'Untitled event',
              event.start,
              event.end
            );
            event.reminderSentAt = now.toISOString();
            eventsChanged = true;
            console.log(`Sent reminder for event: ${event.title} to ${doc.user.email}`);
          }
        }

        if (eventsChanged) {
          await prisma.document.update({
            where: { id: doc.id },
            data: { content: Buffer.from(JSON.stringify(events)) },
          });
        }
      } catch {
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

  checkUpcomingEvents();

  cron.schedule('0 * * * *', () => {
    console.log('Running scheduled event check...');
    checkUpcomingEvents();
  });
};
