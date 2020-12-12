FROM node:14.15.1-alpine3.12

ADD . /webapp/antifraud

RUN apk add tzdata curl && \
    ln -s /usr/share/zoneinfo/Europe/Moscow /etc/localtime && \
    rm -rf /var/cache/apk/* && \
    cd /webapp/antifraud && npm i

EXPOSE 5050

WORKDIR /webapp/antifraud

CMD ["npm","start"]