FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS prod
# O build usa base /sistemas/feira/ (vite.config.ts), então os arquivos ficam nesse subcaminho.
COPY --from=build /app/dist /usr/share/nginx/html/sistemas/feira
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
