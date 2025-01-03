import { S3Client, GetObjectCommand, CopyObjectCommand, TaggingDirective } from '@aws-sdk/client-s3'
import fs from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'
import * as tar from 'tar'

const pipelineAsync = promisify(pipeline)

/**
 * @returns String - The command to execute on the remote server to upload the file to S3
 * @param {String} filePath - The path on the remote server to the file that needs to be uploaded
 * @param {String} bucket - The S3 bucket to upload the file to
 * @param {String} s3Path - The path in the S3 bucket to upload the file to
 * @param {String} accessKeyId - The access key ID for the S3 bucket
 * @param {String} secretAccessKey - The secret access key for the S3 bucket
 * @param {String} endpoint - The S3 endpoint to connect to
 * @example
 * // Returns `
 * //   aws s3 cp /path/to/file s3://bucket/path/to/file --endpoint-url https://s3-endpoint
 * // `
 *
 */
export function getBashCommand(config, tmpPath, remotePath, folders, archive) {
  const pathToUpload = archive ? tmpPath : folders[0];

  const bashScript = `
    export AWS_ACCESS_KEY_ID=${config.s3.accessKeyId}
    export AWS_SECRET_ACCESS_KEY=${config.s3.secretAccessKey}
    export AWS_DEFAULT_REGION=${config.s3.region}
    export S3_ENDPOINT=${config.s3.endpoint}

    # Create tarball if archiving is enabled
    ${archive ? getBashTarCommand(tmpPath, folders) : ''}

    # Check the size of the file or folder to upload
    echo "Backup size:"
    du -sh "${pathToUpload}"

    # Upload file or folder to S3
    echo "Uploading to s3://${config.s3.bucket}/${remotePath}"
    if ! aws s3 cp "${pathToUpload}" "s3://${config.s3.bucket}/${remotePath}" \
      --storage-class STANDARD; then
      echo "Upload failed" >&2
      ${archive ? `rm -v "${tmpPath}"` : ''}
      exit 1
    fi

    # Cleanup if archiving
    ${archive ? `rm -v "${tmpPath}"` : ''}
  `;

  return bashScript;
}

function getBashTarCommand(tmpPath, folders) {
  const bashScript = `
      # Create tarball
      echo "Creating tarball of ${folders.length} folders"
      tar --exclude='node_modules' --exclude='.git' --exclude='.cache' -czf ${tmpPath} ${folders.join(' ')}
    `

  return bashScript
}

async function downloadFile(config, remotePath, localPath) {
  console.info('>> Downloading file from S3...')
  const s3Client = new S3Client({
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  })

  const params = {
    Bucket: config.s3.bucket,
    Key: remotePath,
  }

  // Stream to local file
  const fileStream = fs.createWriteStream(localPath)
  const command = new GetObjectCommand(params)
  const { Body } = await s3Client.send(command)
  return pipelineAsync(Body, fileStream)
}

async function extractTarGz(filePath, extractPath) {
  return tar.x({
    file: filePath,
    cwd: extractPath,
  })
}

// List files with file size recursively
async function listFiles(dirPath, level = 0) {
  const files = []
  const dirents = await fs.promises.readdir(dirPath, { withFileTypes: true })
  for (const dirent of dirents) {
    const fullPath = `${dirPath}/${dirent.name}`
    if(files.length < 10) {
      const stat = await fs.promises.stat(fullPath)
      if (dirent.isDirectory()) {
        files.push({
          name: dirent.name,
          type: 'directory',
          size: stat.size,
          level,
          label: `${' \u2502'.repeat(level)} \u251C\u2500 ${dirent.name}`,
        })
      } else {
        files.push({
          name: dirent.name,
          type: 'file',
          size: stat.size,
          level,
          label: `${' \u2502'.repeat(level)} \u251C\u2500 ${dirent.name} (${stat.size} bytes)`,
        })
      }
    }
    if (files.length >= 10) {
      files.push({
        name: '...',
        type: 'directory',
        size: 0,
        label: `${' \u2502'.repeat(level)} \u2514\u2500 ...`,
      })
      break
    }
    files.push(...(dirent.isDirectory() ? await listFiles(fullPath, level + 1) : []))
  }
  return files
}

async function listFilesTarGz(localPath) {
  const extractPath = await fs.promises.mkdtemp(`/tmp/extracted-${Date.now()}`)
  console.info(`>> Extracting ${localPath} to ${extractPath}`)
  await extractTarGz(localPath, extractPath)
  console.info(`>> Listing contents of ${extractPath}`)
  const files = listFiles(extractPath)
  console.info('>> Cleaning up extracted files...')
  deleteFolderRecursive(extractPath)
  return files
}

async function deleteFolderRecursive(path) {
  const files = await fs.promises.readdir(path)
  for (const file of files) {
    const curPath = `${path}/${file}`
    const stat = await fs.promises.lstat(curPath)
    if (stat.isDirectory()) {
      await deleteFolderRecursive(curPath)
    } else {
      await fs.promises.unlink(curPath)
    }
  }
  await fs.promises.rmdir(path)
}

export async function getArchiveContent(config, remotePath, archive) {
  if(archive) {
    const localPath = `/tmp/backup-${Date.now()}.tar.gz`
    await downloadFile(config, remotePath, localPath)
    console.info('>> Download complete.')

    const firstLevelFiles = await listFilesTarGz(localPath)
    console.info(`>> Found ${firstLevelFiles.length} files in the archive`)

    console.info('>> Deleting local tar.gz file...')
    fs.promises.unlink(localPath)

    return firstLevelFiles
  } else {
    // download the file
    const localPath = `/tmp/backup-${Date.now()}`
    await downloadFile(config, remotePath, localPath)
    console.info('>> Download complete.')
    fs.promises.unlink(localPath)
    return [remotePath.split('/').pop()]
  }
}

export async function duplicateBackup(config, remotePath, type) {
  console.info(`>> Duplicating backup ${remotePath} for ${type}`)
  const s3Client = new S3Client({
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  })

  // Build the new name for the file
  // @example 'backup-bot/eco2/eco-starter.tar.gz' => `backup-bot/eco2/eco-starter-${type}.tar.gz`
  const parts = remotePath.split('/')
  const fileName = parts.pop()
  const [name, ...ext] = fileName.split('.')
  const Key = `${parts.join('/')}/${name}-${type}.${ext.join('.')}`

  const params = {
    Bucket: config.s3.bucket,
    CopySource: `${config.s3.bucket}/${remotePath}`,
    Key,
    Tagging: `backup-type=${type}`,
    TaggingDirective: 'REPLACE',
  }

  const command = new CopyObjectCommand(params)
  await s3Client.send(command)
}
