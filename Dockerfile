FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN yarn
# If you are building your code for production
# RUN npm install --only=production

RUN mkdir -p /etc/letsencrypt

# Bundle app source
COPY . .

EXPOSE 3002
CMD [ "npm", "start" ]