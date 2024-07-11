import nodemailer from 'nodemailer'

export function createTransporter(emailConfig) {
  return nodemailer.createTransport({
    host: emailConfig.smtp_server,
    port: emailConfig.smtp_port,
    secure: false,
    auth: {
      user: emailConfig.username,
      pass: emailConfig.password
    }
  })
}

export function sendEmail(transporter, report, emailConfig) {
  const mailOptions = {
    from: emailConfig.username,
    to: emailConfig.to,
    subject: 'Backup Report',
    text: report
  }

  return transporter.sendMail(mailOptions)
}
