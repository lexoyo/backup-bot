import 'dotenv/config'
import config from './config.js'
import { createSSHClient, createBackup } from './ssh.js'
import { createTransporter, sendEmail } from './email.js'
import { getArchiveContent, duplicateBackup } from './s3.js'

DOWNLOAD_MAX_RETRY = 3

let report = ''
function addToReport(message, type = 'log') {
  switch (type) {
    case 'error':
      console.error(message)
      break
    case 'warn':
      console.warn(message)
      break
    case 'info':
      console.info(message)
      break
    default:
      console.log(message)
  }
  report += `[${type.toUpperCase()}] ${message}\n`
}

async function runBackup() {
  const mailClient = createTransporter(config.email)
  let errorOccured = false

  console.info(`> Starting backup process of ${config.servers.length} servers`)
  for (const server of config.servers) {
    // Conncetion to S3
    try {
      const intro = `Backing up ${server.host}`
      addToReport(`\n\n${intro}\n${'-'.repeat(intro.length)}`)
      const sshClient = await createSSHClient(server)
      let logs = ''
    } catch (err) {
      addToReport(`Connection error for ${server.host}: ${err.message || error}`, 'error')
      console.error(err)
      errorOccured = true
    }
    if(errorOccured) {
      addToReport(`\u26D4 Backup failed for ${server.host}`, 'error')
      continue
    }

    // Create backup and upload to S3
    try {
      let start = Date.now()
      if (server.backupCommand) {
        console.info(`> Running custom backup command on ${server.host}: ${server.backupCommand}`)
        await new Promise((resolve, reject) => {
          sshClient.exec(server.backupCommand, (err, stdout, stderr) => {
            if (err) {
              addToReport(`Error running custom backup command on ${server.host}: ${stderr}`, 'error')
              reject(err)
            } else {
              console.info(`> Custom backup command ran on ${server.host}`)
              resolve()
            }
          })
        })
      }
      console.info(`> Backing up ${server.folders.length} folders on ${server.host}`)
      logs = await createBackup(sshClient, server.folders, config, server.remotePath)
      addToReport(`Successfully backed up ${server.folders.length} folders on ${server.host}\nCompleted in ${(Date.now() - start) / 1000}s`)
      start = Date.now()
      addToReport(`Downloading files from s3://${config.s3.bucket}/${server.remotePath}`)
      if (!config.dryRun) {
        let retried = 0
        let downloadError
        do {
          try {
            downloadError = null
            const contents = await getArchiveContent(config, server.remotePath)
            addToReport(`Successfully downloaded ${contents.length} files from s3://${config.s3.bucket}/${server.remotePath}\nCompleted in ${(Date.now() - start) / 1000}s`)
            if (config.includeFileTree) {
              addToReport(`Files tree in the archive:\n${contents.map((f) => f.label).join('\n')}`)
            }
          } catch(retryError) {
            addToReport(`Warning ${retried + 1} / ${DOWNLOAD_MAX_RETRY}: downloading files from s3://${config.s3.bucket}/${server.remotePath}: ${retryError.message || retryError}`, 'warn')
            downloadError = retryError
          }
        } while (downloadError && ++retried < DOWNLOAD_MAX_RETRY)
        if (downloadError) {
          addToReport(`Failed to download files from s3://${config.s3.bucket}/${server.remotePath} after 3 retries`, 'error')
          throw downloadError
        }
      } else {
        addToReport('Dry run enabled, skipping download')
      }
    } catch (error) {
      addToReport(`Error backing up ${server.host}: ${error.message || error || logs}`, 'error')
      errorOccured = true
    }
    if(errorOccured) {
      addToReport(`\u26D4 Backup failed for ${server.host}`, 'error')
      continue
    }
    // Duplicate the backups to implement GFS (Grandfather/father/son) strategy
    if (config.strategy?.type === 'gfs') {
      try {
        addToReport(`GFS strategy is used.`)
        const today = new Date(config.forceCurrentDate || Date.now())
        addToReport(`Today is ${today.toISOString()}`)
        // Yearly
        if (today.getMonth() === 0 && today.getDate() === 1) {
          addToReport(`It's the first day of the year. Duplicate the backup for safekeeping.`)
          start = Date.now()
          await duplicateBackup(config, server.remotePath, 'yearly')
          addToReport(`Yearly backup completed in ${(Date.now() - start) / 1000}s`)
        }
        // Monthly
        if (today.getDate() === 1) {
          addToReport(`It's the first day of the month. Duplicate the backup for safekeeping.`)
          start = Date.now()
          await duplicateBackup(config, server.remotePath, 'monthly')
          addToReport(`Monthly backup completed in ${(Date.now() - start) / 1000}s`)
        }
        // Weekly
        if (today.getDay() === 0) {
          addToReport(`It's Sunday. Duplicate the backup for safekeeping.`)
          start = Date.now()
          await duplicateBackup(config, server.remotePath, 'weekly')
          addToReport(`Weekly backup completed in ${(Date.now() - start) / 1000}s`)
        }
      } catch (error) {
        addToReport(`Error duplicating backup for ${server.host} with strategy ${config.strategy?.type}: ${error.message || error}`, 'error')
        errorOccured = true
      }
      if(errorOccured) {
        addToReport(`\u26D4 Backup failed for ${server.host}`, 'error')
        continue
      }
    }
    addToReport(`\u2705 Done with ${server.host}`)
  }

  console.info('> Backup process finished. Report:', report)
  await sendEmail(mailClient, report, config.email, errorOccured)
}

runBackup().catch(console.error)
