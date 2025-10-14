# build stage
FROM node:18 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# production stage
FROM node:18-alpine AS production
WORKDIR /usr/src/app
COPY --from=build /usr/src/app .
CMD ["npm", "start"]
