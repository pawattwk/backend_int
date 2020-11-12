FROM node:12

ADD . app

WORKDIR app

ENV TZ=Asia/Bangkok

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

#ENV NODE_ENV production

RUN npm install --unsafe-perm \
 && npm cache clear --force

RUN npm install form-data

EXPOSE 9213

#ENTRYPOINT [ "./docker-entrypoint.sh" ]
CMD [ "npm","run","dev" ]
