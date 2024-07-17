#!/bin/bash
export PATH=$PATH:/usr/local/bin
. /app/cron.env
cd /app
npm start >> /var/log/cron.log 2>&1
