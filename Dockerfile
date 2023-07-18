FROM node:alpine

WORKDIR /user/src/app

COPY . .

RUN yarn install --frozen-lockfile

# Build the app
RUN yarn run build

CMD [ "node", "dist/main.js" ]

