import 'dotenv/config'
import config from './config.js'
import { createSSHClient as createSSHClient, createBackup } from './ssh.js'
import { createTransporter, sendEmail } from './email.js'

async function runBackup() {
  const mailClient = createTransporter(config.email)
  let report = ''

  console.log(`> Starting backup process of ${config.servers.length} servers`)
  for (const server of config.servers) {
    try {
      const sshClient = await createSSHClient(server)
      console.log(`> Connecting to ${server.host}`)
      try {
        await createBackup(sshClient, server.folders, config, server.remotePath)
        report += `Successfully backed up ${folder} on ${server.host}\n`
      } catch (error) {
        report += `Error backing up ${folder} on ${server.host}: ${error.message}\n`
      }
    } catch (err) {
      console.error(`Error connecting to ${server.host}: ${err.message}`)
      report += `Connection error for ${server.host}: ${err.message}\n`
    }
  }

  //await sendEmail(transporter, report, config.email)
}

runBackup().catch(console.error)
