import nodemailer from 'nodemailer'

export function createTransporter(emailConfig) {
  return nodemailer.createTransport({
    host: emailConfig.server,
    port: emailConfig.port,
    secure: false,
    auth: {
      user: emailConfig.username,
      pass: emailConfig.password,
    }
  })
}

export function sendEmail(transporter, report, emailConfig, errorOccured) {
  console.info(`>> Sending email to ${emailConfig.to}`)
  const mailOptions = {
    from: emailConfig.username,
    to: emailConfig.to,
    subject: errorOccured ? '\u26D4 Error: backup FAILED' : '\u2705 Backup successful',
    text: report,
  }

  return transporter.sendMail(mailOptions)
}
