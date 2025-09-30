const nodemailer = require('nodemailer');
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  /**
   * Send verification email
   */
  static async sendVerificationEmail(email: string, firstName: string): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Welcome to BookReview - Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to BookReview, ${firstName}!</h2>
            <p>Thank you for registering with BookReview. To complete your registration, please verify your email address.</p>
            <p>Your account is now active and you can start exploring books and writing reviews!</p>
            <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0;">If you have any questions, feel free to contact our support team.</p>
            </div>
            <p>Happy reading!</p>
            <p>The BookReview Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    try {
      const resetUrl = `${config.corsOrigin}/reset-password?token=${token}`;
      
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'BookReview - Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>We received a request to reset your password for your BookReview account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <div style="background-color: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser: ${resetUrl}</p>
            </div>
            <p>Best regards,<br>The BookReview Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email after verification
   */
  static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Welcome to BookReview - Start Exploring!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to BookReview, ${firstName}!</h2>
            <p>Your email has been verified and your account is now fully active.</p>
            <p>Here's what you can do on BookReview:</p>
            <ul>
              <li>📚 Browse thousands of books</li>
              <li>⭐ Rate and review books you've read</li>
              <li>🔍 Discover new books with our AI recommendations</li>
              <li>👥 Connect with other book lovers</li>
              <li>📖 Build your personal reading list</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.corsOrigin}/books" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Exploring Books</a>
            </div>
            <p>Happy reading!</p>
            <p>The BookReview Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to: ${email}`);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      throw error;
    }
  }
}
