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
COPY --from=build /app/src/data ./src/data
COPY --from=build /app/src/lib ./src/lib
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY nginx.conf /etc/nginx/http.d/default.conf
RUN rm -f /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN mkdir -p /app/server/data

ENV MUTELEARN_APP_URL=*
ENV MUTELEARN_SERVER_PORT=8787
ENV GEMINI_API_KEY=AIzaSyDDCl1WrZzsPYhnZJYhdo1iZQ6d88KrcKo

EXPOSE 8080
CMD ["/entrypoint.sh"]
