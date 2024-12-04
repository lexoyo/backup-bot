import { exec } from 'child_process'
import { getBashCommand } from './s3.js'
import micromatch from 'micromatch'

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
          exec(`timeout 30m ssh -o "StrictHostKeyChecking no" ${user}@${host} ${command}`, { maxBuffer: 1024 * 50000 }, callback)
        },
        //ls: (path, callback) => {
        //  // List files in a directory
        //  console.info(`>> Listing files in ${path} on ${host}`)
        //  exec(`ssh -o "StrictHostKeyChecking no" ${user}@${host} ls -l ${path}`, callback)
        //},
        fs: {
          //lstat: (path) => new Promise((cbk, rejectCbk) => {
          //  console.info(`>> lstat ${path} on ${host}`)
          //  // Get file stats
          //  exec(`ssh -o "StrictHostKeyChecking no" ${user}@${host} stat ${path}`, (err, stdout, stderr) => {
          //    console.info(`>> lstat done(${stderr})`)
          //    if (err) return rejectCbk(stderr)
          //    cbk(stdout)
          //  })
          //}),
          //stat: (path) => new Promise((cbk, rejectCbk) => {
          //  console.info(`>> stat ${path} on ${host}`)
          //  // Get file stats
          //  exec(`ssh -o "StrictHostKeyChecking no" ${user}@${host} stat ${path}`, (err, stdout, stderr) => {
          //    console.info(`>> stat done (${stderr})`)
          //    if (err) return rejectCbk(stderr)
          //    cbk(stdout)
          //  })
          //}),
          /**
           * @example readdir('/tmp') // ['file1', 'file2']
           */
          readdir: (path) => new Promise((cbk, rejectCbk) => {
            console.info(`>> readdir ${path} on ${host}`)
            // List files in a directory
            exec(`ssh -o "StrictHostKeyChecking no" ${user}@${host} ls -a ${path}`, (err, stdout, stderr) => {
              console.info(`>> readdir done (${stderr})`, stdout.split('\n').filter(Boolean).length)
              if (err) return rejectCbk(stderr)
              cbk(stdout.split('\n').filter(Boolean))
            })
          }),
        },
      })
    })
  })
}

/**
 * Expand all paths from the folders list
 * @example resolvePaths(['/tmp/*', '/var/log/*'], console.log) // ['/tmp/file1', '/tmp/file2', '/var/log/file1', '/var/log/file2']
 */
async function resolvePaths(client, folders) {
  console.info('>> Resolving paths', folders)
  const resolved = await Promise.all(folders.map(async (path) => {
    path = path.replace(/\/$/, '')
    const fileName = path.split('/').pop()
    const baseName = [...path.split('/').slice(0, -1)].join('/')
    const files = await client.fs.readdir(baseName)
    return micromatch(files, fileName).map((file) => `${baseName}/${file}`)
  }))
  console.info('>> Resolved paths', resolved.flat())
  return resolved.flat()
}

export function createBackup(client, folders, config, remotePath, tmpPathRoot = '/tmp', archive) {
  return new Promise((resolve, reject) => {
    return resolvePaths(client, folders)
    .then((resolved) => {
      const tmpPath = `${tmpPathRoot}/${remotePath.split('/').join('_')}`

      const command = `bash -c '${getBashCommand(config, tmpPath, remotePath, resolved, archive)}'`
      client.exec(command, (err, stdout, stderr) => {
        if (err) return reject(stderr)
        console.info(`>> Backup of ${resolved.length} folders uploaded to ${remotePath}`)
        resolve(stdout)
      })
    })
    .catch(err => {
      console.error('Error expanding paths', err)
      reject(err)
    })
  })
}
