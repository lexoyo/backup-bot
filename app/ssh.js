import { exec } from 'child_process'
import { getBashCommand } from './s3.js'

export function createSSHClient({host, user}) {
  // Connect with the native SSH client and disconnect immediately
  return new Promise((resolve, reject) => {
    console.log(`>> Connecting to ${user}@${host}`)
    exec(`ssh ${user}@${host} exit`, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error connecting to ${host}: ${stderr}`)
        reject(err)
        return
      }
      console.log(`>> Connected to ${host}`)
      resolve({
        exec: (command, callback) => {
          // Run the actual command over ssh
          console.log(`>> Running command on ${host}: ${command}\nssh ${user}@${host} ${command}`)
          exec(`ssh ${user}@${host} ${command}`, callback)
        },
        end: () => {
          console.log(`>> Disconnecting from ${host}`)
        }
      })
    })
  })
}

export function createBackup(client, folders, config, remotePath) {
  return new Promise((resolve, reject) => {
    console.log(`>> Creating backup of ${folders.length} folders on ${remotePath}`)
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '')
    const targzFilename = `${remotePath.split('/').join('_')}__${timestamp}.tar.gz`
    const command = `tar -czf /tmp/${targzFilename} ${folders.join(' ')} && ${getBashCommand(config, `/tmp/${targzFilename}`, targzFilename)}`

    client.exec(command, (err, stdout, stderr) => {
      console.log({stdout, stderr})
      if (err) return reject(err)
      console.log(`>> Backup of ${folders.length} folders uploaded to ${remotePath}`)
      resolve(targzFilename)
    })
  })
}
