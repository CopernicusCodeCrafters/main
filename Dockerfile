FROM kwundram/backend:1.0

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY . ./

RUN npm install
#RUN docker pull brianpondi/openeocubes
#RUN docker run -p 8000:8000  brianpondi/openeocubes




EXPOSE 3000
EXPOSE 27017
EXPOSE 8000
EXPOSE 8081

CMD ["npm" , "start" ]
