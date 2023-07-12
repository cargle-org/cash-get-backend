FROM node:alpine

WORKDIR /user/src/app

COPY . .

RUN yarn install --frozen-lockfile


# Build the app
# RUN yarn run build

# ENV SECRET_KEY=crm_user_secret
# ENV MONGO_DB_URL=mongodb://mongodb:27017/sapa-crm-user
# ENV PORT=6001
# ENV NODE_ENV=DEVELOPMENT

EXPOSE 5000