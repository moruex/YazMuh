FROM node:22-slim

# install curl and CA certificates for healthchecks
USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
# clean any existing lockfiles/modules then install deps
RUN rm -rf node_modules package-lock.json \
 && npm install

COPY . .

EXPOSE 4000
CMD ["npm", "run", "start"]
