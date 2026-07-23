# Stage 1: Build the React app
FROM node:22-alpine AS builder
WORKDIR /app

# Configure yarn network timeouts
ENV YARN_NETWORK_TIMEOUT=300000
ENV YARN_NETWORK_CONCURRENCY=1

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout=300000

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY . .
RUN yarn build

# Stage 2: Serve the built app
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]