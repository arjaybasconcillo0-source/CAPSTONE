import nodemailer from 'nodemailer';
import User from '../models/User.js';

const MOLD_RECOMMENDATION =
  'Move the item to a clean, dry, well-ventilated area and sun-dry it briefly. Avoid prolonged direct sunlight, and make sure it is completely dry before storage.';

export async function sendMoldDetectedNotification({
  filename,
  photoId,
  confidence,
  scannedAt
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      'Email is not configured. Set SMTP_HOST and SMTP_FROM (or SMTP_USER) in the backend environment.'
    );
  }

  if (Boolean(user) !== Boolean(pass)) {
    throw new Error('SMTP_USER and SMTP_PASS must both be set or both be empty.');
  }

  const admins = await User.find({ role: 'admin' }).select('email').lean();
  const recipients = [...new Set([
    ...admins.map(admin => admin.email).filter(Boolean),
    user,
    from
  ].filter(Boolean))];

  if (!recipients.length) {
    throw new Error('No admin or configured SMTP email recipients are available.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE.toLowerCase() === 'true'
      : port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    ...(user && pass ? { auth: { user, pass } } : {})
  });

  const numericConfidence = Number(confidence);
  const confidencePercent = Number.isFinite(numericConfidence)
    ? `${(numericConfidence <= 1 ? numericConfidence * 100 : numericConfidence).toFixed(2)}%`
    : 'Unavailable';

  await transporter.sendMail({
    from,
    to: recipients,
    subject: 'Water Lily alert: mold detected',
    text: [
      'The product inspection model classified a captured item as Moldy.',
      `Photo: ${filename}`,
      `Photo record: ${photoId}`,
      `Model confidence: ${confidencePercent}`,
      `Scanned at: ${scannedAt.toISOString()}`,
      '',
      'Recommended action:',
      MOLD_RECOMMENDATION
    ].join('\n')
  });

  return { recipientCount: recipients.length };
}
