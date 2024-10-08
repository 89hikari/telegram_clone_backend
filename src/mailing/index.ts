import { Resend } from 'resend';
import VerifyCode from './templates/verifyCode';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerifyEmail = (email: string) => {
  const code = (Math.random() + 1).toString(36).substring(8).toUpperCase();
  resend.emails.send({
    from: 'Vav <onboarding@resend.dev>',
    to: email,
    subject: 'Your verification code',
    react: VerifyCode(code),
  });

  return code;
};
