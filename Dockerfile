FROM node:18

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY . ./

RUN npm install

EXPOSE 3000
EXPOSE 27017
EXPOSE 8000
EXPOSE 8081

CMD ["npm" , "start" ]
