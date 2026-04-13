# Stage 1: Build the Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build the Backend & Final Image
FROM node:20-alpine
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Set Environment Variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose Port
EXPOSE 5000

# Start Application
CMD ["node", "backend/server.js"]
