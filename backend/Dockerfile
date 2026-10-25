# Use the official lightweight Node.js 18 environment
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files first to leverage Docker's caching mechanism
COPY package*.json ./

# Install production dependencies only to keep the image slim
RUN npm ci --only=production

# Copy the rest of your application code into the container
COPY . .

# Expose port 5000 (matching the port your Express backend listens on)
EXPOSE 5000

# Set the default command to start your application
CMD ["node", "server.js"]
