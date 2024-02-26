FROM ghcr.io/puppeteer/puppeteer:22.1.0 

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    HOST=0.0.0.0 \
    PORT=3333 \
    NODE_ENV=production \
    APP_KEY=kgCt1wFKQsqCXu2k9mKsHO9wMBmAYWR2 \
    DRIVE_DISK=local \
    DB_CONNECTION=pg \
    PG_HOST=dpg-cn9pkfmd3nmc73djm9hg-a.oregon-postgres.render.com \
    PG_PORT=5432 \
    PG_USER=oddscomparisondb2_user \
    PG_PASSWORD=WXs9dwxJC6ZsSohiSR4BO9hDhmXnoi2N \
    PG_DB_NAME=oddscomparisondb2

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./
RUN yarn install --production

COPY . .
RUN node ace migration:run --force

CMD ["node", "server.js"]