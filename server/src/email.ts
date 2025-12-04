import nodemailer from 'nodemailer';

// Create email transporter
// You'll need to configure this with your email service
export const createTransporter = () => {
  // For development, use a test account or your email service
  // Example with Gmail (you'll need to enable "Less secure app access" or use App Password)
  return nodemailer.createTransport({
    service: 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

export const sendEventReminderEmail = async (
  to: string,
  eventTitle: string,
  eventStart: Date,
  eventEnd?: Date
) => {
  const transporter = createTransporter();

  const formattedStart = new Date(eventStart).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedEnd = eventEnd ? new Date(eventEnd).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }) : null;

  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@notpe.com',
    to,
    subject: `📅 Reminder: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f5f7;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📅 Event Reminder</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">${eventTitle}</h2>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #666;">
              <strong style="color: #333;">🕐 Start:</strong> ${formattedStart}
            </p>
            ${formattedEnd ? `
            <p style="margin: 5px 0; color: #666;">
              <strong style="color: #333;">🕐 End:</strong> ${formattedEnd}
            </p>
            ` : ''}
          </div>
          <p style="color: #666; line-height: 1.6;">
            This is a friendly reminder about your upcoming event. Don't forget to join!
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated reminder from your Zenith Calendar
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} for event: ${eventTitle}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
