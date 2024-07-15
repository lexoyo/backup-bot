import { exec } from 'child_process'
import { getBashCommand } from './s3.js'

export function createSSHClient({host, user}) {
  // Connect with the native SSH client and disconnect immediately
  return new Promise((resolve, reject) => {
    console.info(`>> Connecting to ${user}@${host}`)
    exec(`ssh -o "StrictHostKeyChecking no" ${user}@${host} exit`, (err, stdout, stderr) => {
      console.info(`>> Connection logs: ${stdout}`)
      if (err) {
        console.error(`Error connecting to ${host}: ${stderr}`)
        reject(err)
        return
      }
      console.info(`>> Connected to ${host}`)
      resolve({
        host,
        user,
        exec: (command, callback) => {
          // Run the actual command over ssh
          console.info(`>> Running command on ${host}`)
          console.log(`>> ${command.split('\n').join('\n>> ')}`)
          exec(`timeout 30m ssh -o "StrictHostKeyChecking no" ${user}@${host} ${command}`, callback)
        },
      })
    })
  })
}

export function createBackup(client, folders, config, remotePath) {
  return new Promise((resolve, reject) => {
    console.info(`>> Creating backup of ${folders.length} folders on ${remotePath}`)
    const tmpPath = `/tmp/${remotePath.split('/').join('_')}`

    const command = `bash -c '${getBashCommand(config, tmpPath, remotePath, folders)}'`
    client.exec(command, (err, stdout, stderr) => {
      if (err) return reject(err)
      console.info(`>> Backup of ${folders.length} folders uploaded to ${remotePath}`)
      resolve(stdout)
    })
  })
}
