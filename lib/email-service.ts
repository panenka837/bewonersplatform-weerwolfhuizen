import nodemailer from 'nodemailer';

// Configureer de e-mail transporter
// Voor productie zou je hier echte SMTP-instellingen gebruiken
// Voor ontwikkeling gebruiken we een testaccount
let transporter: nodemailer.Transporter;

// Initialiseer de e-mail transporter
export async function initEmailService() {
  // Als we al een transporter hebben, gebruik die
  if (transporter) return transporter;
  
  // Voor ontwikkeling: gebruik een ethereal.email testaccount
  // In productie zou je hier je eigen SMTP-instellingen gebruiken
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || testAccount.user,
      pass: process.env.SMTP_PASS || testAccount.pass,
    },
  });
  
  return transporter;
}

// Functie om een e-mail te sturen
export async function sendEmail({
  to,
  subject,
  text,
  html
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    // Zorg ervoor dat de transporter is geïnitialiseerd
    const mailer = await initEmailService();
    
    // Verzend de e-mail
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"Bewonersplatform Weerwolfhuizen" <noreply@weerwolfhuizen.nl>',
      to,
      subject,
      text,
      html: html || text,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    
    // Voor testaccounts, log de URL waar je de e-mail kunt bekijken
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Functie specifiek voor het versturen van chatnotificaties
export async function sendChatNotification({
  to,
  senderName,
  message,
  chatUrl
}: {
  to: string;
  senderName: string;
  message: string;
  chatUrl: string;
}) {
  const subject = `Nieuw bericht van ${senderName}`;
  
  const text = `
    Hallo,
    
    Je hebt een nieuw bericht ontvangen van ${senderName}:
    
    "${message}"
    
    Klik op de volgende link om te antwoorden:
    ${chatUrl}
    
    Met vriendelijke groet,
    Bewonersplatform Weerwolfhuizen
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nieuw bericht ontvangen</h2>
      <p>Hallo,</p>
      <p>Je hebt een nieuw bericht ontvangen van <strong>${senderName}</strong>:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p style="margin: 0;">"${message}"</p>
      </div>
      <p>
        <a href="${chatUrl}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Antwoorden
        </a>
      </p>
      <p style="margin-top: 20px; color: #6b7280; font-size: 0.9em;">
        Met vriendelijke groet,<br>
        Bewonersplatform Weerwolfhuizen
      </p>
    </div>
  `;
  
  return sendEmail({ to, subject, text, html });
}
