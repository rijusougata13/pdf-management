FROM node:14

WORKDIR /app

COPY package*.json ./



RUN npm install



COPY . .

EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
