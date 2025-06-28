# Use a Node.js base image
FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the app (e.g. server.js)
COPY . .

# Expose the port your server listens on
EXPOSE 10000

# Start the server
CMD ["npm", "start"]


