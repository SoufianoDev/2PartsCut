FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Set environment variables for GitHub Pages
ENV PORT=8080
ENV NODE_ENV=production

# Add GitHub Pages specific headers
# These headers are needed for SharedArrayBuffer support
LABEL cross-origin-opener-policy="same-origin"
LABEL cross-origin-embedder-policy="require-corp"

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
