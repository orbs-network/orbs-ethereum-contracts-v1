FROM golang:1.11.4

RUN apt-get update

RUN apt-get install -y jq curl git vim build-essential

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

RUN npm install yarn -g
RUN ls -la /root/.npm/
RUN npm install truffle -g
