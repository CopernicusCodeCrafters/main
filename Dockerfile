FROM node:18
#FROM kwundram/backend:1.0
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY . ./
#RUN apt-mark hold node
RUN apt-get update && apt-get install -y build-essential
#RUN curl -sL   
#RUN apt-get install -y nodejs
RUN apt update
RUN apt install -y software-properties-common
RUN apt-get install -y python3-launchpadlib
RUN add-apt-repository -y ppa:deadsnakes/ppa

RUN apt-get update
RUN apt install -f -y python3
RUN apt install -y python-is-python3
RUN npm install -g npm@10.3.0
RUN node -v
RUN apt-get update -y && apt-get install -y node-pre-gyp
RUN node-pre-gyp -v
RUN npm install -g node-gyp@10.0.1
RUN apt-get install -y libgdal-dev
#RUN npm install gdal --build-from-source --shared_gdal
RUN npm install
#RUN docker pull brianpondi/openeocubes
#RUN docker run -p 8000:8000  brianpondi/openeocubes
#FROM node:17



EXPOSE 3000
EXPOSE 27017
EXPOSE 8000
EXPOSE 8081

CMD ["npm" , "start" ]
