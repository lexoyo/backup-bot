# backup-bot

Backup Bot is an open-source software designed to automate daily backups of specified directories from multiple servers over SSH.

## Features

- [x] Connect to multiple servers via SSH
- [x] Create ZIP backups of specified folders
- [x] Upload backups to S3-compatible storage
- [x] Send email reports with backup status and errors
- [x] Execute a command before backing up a server
- [x] Support folders with blob in their names, e.g. /path/to/folder/my_*_data
- [ ] npm package @internet2000/backup-bot
- [ ] Docker image internet2000/backup-bot
- [ ] In config add a list of files with a "delay", check that the file is in the archive and it is recent enough

## Prerequisites

- Node.js (version 14 or later)
- SSH access to the servers
- rsync installed on the servers
- S3-compatible storage (e.g., AWS S3, MinIO)
- Email SMTP server for sending reports

## Installation

### Using npx

```sh
npx @internet2000/backup-bot
```

### Using npm

```sh
npm install -g @internet2000/backup-bot
```

### Using Docker

1. Build the Docker image:

    ```sh
    docker build -t backup-bot .
    ```

2. Run the Docker container:

    ```sh
    docker run -v $(pwd)/config.yaml:/app/config.yaml backup-bot
    ```

## Configuration

### Config file

Create a `config.yaml` file in the root directory with the following structure:

```yaml
servers:
  - host: server1.example.com
    user: username
    backupCommand: "echo \"This command will run before backup\""
    folders:
      - /path/to/folder/ # Folders need a trailing slash
      - /path/to/file.txt # Support files
      - /path/to/all_*_folders/ # Support "*" in the file name or last folder only
  - host: server2.example.com
    user: username
    folders:
      - /path/to/folder3
s3:
  endpoint: s3.example.com
  bucket: your-bucket-name
  access_key: your-access-key
  secret_key: your-secret-key
email:
  smtp_server: smtp.example.com
  smtp_port: 587
  username: your-email@example.com
  password: your-email-password
  to: recipient@example.com
```

### Env vars

Here are the available environment variables.

S3-compatible storage:

- `S3_ENDPOINT`: S3-compatible storage endpoint
- `S3_BUCKET`: S3 bucket name
- `S3_ACCESS_KEY_ID`: S3 access key
- `S3_SECRET_ACCESS_KEY`: S3 secret key
- `S3_REGION`: S3 region

Email:

- `SMTP_SERVER`: SMTP server
- `SMTP_PORT`: SMTP port
- `SMTP_USERNAME`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `MAIL_FROM`: Email sender
- `MAIL_TO`: Email recipient
- `MAIL_DRY_RUN`: Dry run mode (true if exists)

Report:

- `REPORT_SUBJECT_SUCCESS`: Email subject for successful backups
- `REPORT_SUBJECT_ERROR`: Email subject for failed backups
- `REPORT_INCLUDE_FILE_TREE`: Include file tree in the email report, true if set to 'true', false by default

Used by the Docker image:

- `CONFIG_YAML`: Content of the `config.yaml` file, see the [Config file](#config-file) section
- `SSH_PRIVATE_KEY`: SSH private key
- `CRONJOB`: Cron job schedule, e.g `0 1 * * * /app/run.sh`

## Usage

### Using npx

```sh
npx @internet2000/backup-bot
```

### Using npm

```sh
backup-bot
```

### Using Docker

```sh
docker run -v $(pwd)/config.yaml:/app/config.yaml @internet2000/backup-bot
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin main`)
5. Open a pull request
