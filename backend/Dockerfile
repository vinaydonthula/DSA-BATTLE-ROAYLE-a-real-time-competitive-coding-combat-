# Use an official Node.js runtime as a parent image
FROM node:18-bullseye

# Set environment variable for non-interactive installs
ENV DEBIAN_FRONTEND=noninteractive

# Install required compilers and tools
# - python3 for Python execution
# - build-essential covers gcc and g++
# - default-jdk covers javac and java
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Create aliases so "python" triggers python3
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) first
# This optimizes Docker caching of node_modules
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the Node server
CMD ["npm", "start"]
