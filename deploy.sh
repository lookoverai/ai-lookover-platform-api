#!/bin/bash

# Stop and remove existing container if it exists
docker stop ai-lookover-platform-api || true
docker rm ai-lookover-platform-api || true

# Remove existing image
docker rmi ai-lookover-platform-api-image || true

# Build the Docker image with no cache
docker build --no-cache -t ai-lookover-platform-api-image .

# Run the container with interactive terminal, exposed port 5990, and named container
docker run -d -p 5990:5990 --name ai-lookover-platform-api ai-lookover-platform-api-image

# Check if the container is running
docker ps | grep ai-lookover-platform-api
