FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./

FROM base AS dev
RUN npm install
COPY . .
EXPOSE 3333
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm install
COPY . .
RUN npm run prisma:generate && npm run build

FROM node:20-alpine AS prod
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 3333
CMD ["npm", "run", "start"]
