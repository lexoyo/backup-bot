# backup-bot

Backup Bot is an open-source software designed to automate daily backups of specified directories from multiple servers over SSH.

## Features

- [x] Connect to multiple servers via SSH
- [x] Create ZIP backups of specified folders
- [x] Upload backups to S3-compatible storage
- [x] Send email reports with backup status and errors
- [ ] npm package @internet2000/backup-bot
- [ ] Docker image internet2000/backup-bot

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

Create a `config.yaml` file in the root directory with the following structure:

```yaml
servers:
  - host: server1.example.com
    user: username
    folders:
      - /path/to/folder1
      - /path/to/folder2
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
