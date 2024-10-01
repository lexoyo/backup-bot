#!/bin/bash

# Ensure the bucket name is provided as a parameter
if [ -z "$1" ]; then
    echo "Usage: $0 <bucket-name>"
    exit 1
fi

# Bucket name (passed as a parameter)
BUCKET_NAME="$1"

# Lister toutes les versions dans le bucket
versions=$(aws s3api list-object-versions --bucket "$BUCKET_NAME" --query 'Versions[].[Key,VersionId]' --output text)

# Lire la sortie ligne par ligne et supprimer chaque version
echo "Suppression des versions d'objets du bucket : $BUCKET_NAME"
while read -r key version_id; do
    echo "Suppression de l'objet : $key (Version: $version_id)"
    aws s3api delete-object --bucket "$BUCKET_NAME" --key "$key" --version-id "$version_id"
done <<< "$versions"

echo "Suppression des versions terminée."

