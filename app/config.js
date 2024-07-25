import fs from 'fs'
import yaml from 'js-yaml'

console.info('> Loading config from config.yaml')
const config = yaml.load(fs.readFileSync('config.yaml', 'utf8'))

export default {
  // Config from the YAML file
  ...config,
  // Config from environment variables
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION,
  },
  email: {
    server: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT,
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    dryRun: !!process.env.MAIL_DRY_RUN,
  }
}
