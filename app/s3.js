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
export function getBashCommand(config, filePath, remotePath) {
  return `
    export AWS_ACCESS_KEY_ID=${config.s3.accessKeyId}
    export AWS_SECRET_ACCESS_KEY=${config.s3.secretAccessKey}
    export AWS_DEFAULT_REGION=${config.s3.region}
    export S3_ENDPOINT=${config.s3.endpoint}
    aws s3 cp ${filePath} s3://${config.s3.bucket}/${remotePath}
  `
}
