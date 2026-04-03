FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache nginx
WORKDIR /app
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/server ./server
COPY --from=build /app/src/data/lmsDemoData.js ./src/data/lmsDemoData.js
COPY --from=build /app/src/lib/textUtils.js ./src/lib/textUtils.js
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN mkdir -p /app/server/data
EXPOSE 8080
CMD ["/entrypoint.sh"]
