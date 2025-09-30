// Mock the entire EmailService to avoid actual email sending
vi.mock('../../services/emailService', () => ({
  EmailService: {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendWelcomeEmail: vi.fn(),
  },
}));

import { EmailService } from '../../services/emailService';

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';

      (EmailService.sendVerificationEmail as vi.Mock).mockResolvedValue(undefined);

      await EmailService.sendVerificationEmail(userEmail, userName);

      expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(userEmail, userName);
    });

    it('should handle email sending error', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';

      (EmailService.sendVerificationEmail as vi.Mock).mockRejectedValue(new Error('SMTP Error'));

      await expect(
        EmailService.sendVerificationEmail(userEmail, userName)
      ).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const resetToken = 'reset-token-123';

      (EmailService.sendPasswordResetEmail as vi.Mock).mockResolvedValue(undefined);

      await EmailService.sendPasswordResetEmail(userEmail, userName, resetToken);

      expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(userEmail, userName, resetToken);
    });

    it('should handle email sending error', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';
      const resetToken = 'reset-token-123';

      (EmailService.sendPasswordResetEmail as vi.Mock).mockRejectedValue(new Error('SMTP Error'));

      await expect(
        EmailService.sendPasswordResetEmail(userEmail, userName, resetToken)
      ).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';

      (EmailService.sendWelcomeEmail as vi.Mock).mockResolvedValue(undefined);

      await EmailService.sendWelcomeEmail(userEmail, userName);

      expect(EmailService.sendWelcomeEmail).toHaveBeenCalledWith(userEmail, userName);
    });

    it('should handle email sending error', async () => {
      const userEmail = 'test@example.com';
      const userName = 'John Doe';

      (EmailService.sendWelcomeEmail as vi.Mock).mockRejectedValue(new Error('SMTP Error'));

      await expect(
        EmailService.sendWelcomeEmail(userEmail, userName)
      ).rejects.toThrow('SMTP Error');
    });
  });
});