FROM node:12

ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV production

RUN mkdir -p /polymorpher
WORKDIR /polymorpher
ADD . /polymorpher

RUN cd /polymorpher && npm install
RUN cd /polymorpher && npm run build:prod

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["npm", "run", "start"]