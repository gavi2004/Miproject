FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY key.pem cert.pem ./
COPY . .
EXPOSE 443
CMD ["npm", "start"]