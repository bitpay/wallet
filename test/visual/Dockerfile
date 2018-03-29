FROM circleci/node:9-browsers
USER root
COPY package.json /copay/package.json
WORKDIR /copay/
RUN npm install --unsafe-perm
COPY . /copay/
CMD [ "npm", "run", "e2e:capture-latest"]