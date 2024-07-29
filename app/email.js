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
  if(emailConfig.dryRun) {
    console.info('>> Dry run enabled, skipping email')
    return Promise.resolve()
  }
  const mailOptions = {
    from: emailConfig.username,
    to: emailConfig.to,
    subject: errorOccured ? emailConfig.subjectError : emailConfig.subjectSuccess,
    text: report,
  }

  return transporter.sendMail(mailOptions)
}
