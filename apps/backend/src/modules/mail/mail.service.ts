import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    if (process.env.EMAIL_HOST === 'smtp.example.com' || !process.env.EMAIL_HOST) {
      console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
      return;
    }
    const info = await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Mudly App" <noreply@mudly.app>',
      to: email,
      subject: 'Your Mudly OTP Code',
      text: `Your OTP code is: ${otp}. It expires in 5 minutes.`,
      html: `<b>Your OTP code is: ${otp}</b>. It expires in 5 minutes.`,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  }

  async sendResetPasswordLink(email: string, token: string) {
      const url = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
      await this.transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'Reset Password Request',
          text: `Click here to reset your password: ${url}`,
          html: `<a href="${url}">Click here to reset your password</a>`,
      });
  }
}
