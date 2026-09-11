FROM node:20-alpine

# Alpine paket yöneticisi ile FFmpeg'i hatasız ve hızlıca kuruyoruz
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]