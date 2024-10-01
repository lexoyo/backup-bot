#!/bin/bash

# Ensure the bucket name is provided as a parameter
if [ -z "$1" ]; then
    echo "Usage: $0 <bucket-name>"
    exit 1
fi

# Bucket name (passed as a parameter)
BUCKET_NAME="$1"

# Function to check the tags of an object
check_tags() {
    local key="$1"

    # Skip objects in the 'elestio-backups/' folder
    if [[ "$key" == elestio-backups/* ]]; then
        return
    fi

    # Get the tags for the object
    local tags=$(aws s3api get-object-tagging --bucket "$BUCKET_NAME" --key "$key" --query 'TagSet[?Key==`backup-type`].Value' --output text)

    # Check if the 'backup-type' tag is correct
    if [[ "$tags" == "daily" || "$tags" == "weekly" || "$tags" == "monthly" ]]; then
        echo "OK: $key is correctly tagged with backup-type=$tags"
    else
        echo "ALERT: $key is not correctly tagged. Current tags: $tags"
    fi
}

# List all objects in the bucket
echo "Checking tags in the bucket $BUCKET_NAME"
object_keys=$(aws s3api list-objects-v2 --bucket "$BUCKET_NAME" --query 'Contents[].Key' --output text)

# Iterate over each object and check the tags
for key in $object_keys; do
    check_tags "$key"
done

echo "Tag check complete."

