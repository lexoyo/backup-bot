import 'dotenv/config'
import config from './config.js'
import { createSSHClient, createBackup } from './ssh.js'
import { createTransporter, sendEmail } from './email.js'
import { getArchiveContent } from './s3.js'

async function runBackup() {
  const mailClient = createTransporter(config.email)
  let report = ''
  let errorOccured = false

  console.info(`> Starting backup process of ${config.servers.length} servers`)
  for (const server of config.servers) {
    try {
      console.info(`> Connecting to ${server.host}`)
      const sshClient = await createSSHClient(server)
      try {
        let start = Date.now()
        console.info(`> Backing up ${server.folders.length} folders on ${server.host}`)
        const logs = await createBackup(sshClient, server.folders, config, server.remotePath)
        report += `Successfully backed up ${server.folders.length} folders on ${server.host}\nCompleted in ${(Date.now() - start) / 1000}s\n`
        console.info(`> Successfully backed up ${server.folders.length} folders on ${server.host} in ${(Date.now() - start) / 1000}s`)
        start = Date.now()
        console.info(`> Downloading files from s3://${config.s3.bucket}/${server.remotePath}`)
        const contents = await getArchiveContent(config, server.remotePath)
        console.info(`> Downloaded ${contents.length} files from s3://${config.s3.bucket}/${server.remotePath} in ${(Date.now() - start) / 1000}s`)
        report += `Successfully downloaded ${contents.length} files from s3://${config.s3.bucket}/${server.remotePath}\nCompleted in ${(Date.now() - start) / 1000}s\n`
        report += `Files tree in the archive:\n${contents.map((f) => f.label).join('\n')}\n`
      } catch (error) {
        report += `Error backing up ${server.host}: ${error.message}\n`
        console.error(`Error backing up ${server.host}: ${error.message}\n`, error)
        errorOccured = true
      }
    } catch (err) {
      console.error(`Error for ${server.host}: ${err.message}`, err)
      report += `Connection error for ${server.host}: ${err.message}\n`
      errorOccured = true
    }
  }

  console.info('> Backup process finished. Report:', report)
  await sendEmail(mailClient, report, config.email, errorOccured)
}

runBackup().catch(console.error)
