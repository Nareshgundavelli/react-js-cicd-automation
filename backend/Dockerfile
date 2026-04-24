
FROM node:18

WORKDIR /opt/app

COPY package*.json ./

RUN npm install

RUN npm install -g pm2

COPY . .

EXPOSE 5001

CMD ["pm2-runtime", "server.js", "--name", "backend-app"]
