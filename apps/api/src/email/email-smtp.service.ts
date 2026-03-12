import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
}

export interface SendEmailOptions {
  smtpConfig: SmtpConfig;
  fromEmail: string;
  password: string;
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string | null;
  references?: string | null;
}

@Injectable()
export class EmailSmtpService {
  private readonly logger = new Logger(EmailSmtpService.name);

  async sendEmail(opts: SendEmailOptions): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: opts.smtpConfig.host,
      port: opts.smtpConfig.port,
      secure: opts.smtpConfig.secure,
      auth: {
        user: opts.fromEmail,
        pass: opts.password,
      },
      // Allow self-signed certs in dev
      tls: { rejectUnauthorized: false },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: opts.fromEmail,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    };

    if (opts.inReplyTo) mailOptions.inReplyTo = opts.inReplyTo;
    if (opts.references) mailOptions.references = opts.references;

    await transporter.sendMail(mailOptions);
    this.logger.log(`[SMTP] Sent email from ${opts.fromEmail} to ${opts.to}`);
  }

  /** Verify SMTP credentials by creating a transporter and calling verify() */
  async verifySmtp(smtpConfig: SmtpConfig, email: string, password: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: { user: email, pass: password },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
  }
}
