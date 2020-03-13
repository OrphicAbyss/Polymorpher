FROM node:12

RUN mkdir -p /polymorpher
WORKDIR /polymorpher
ADD . /polymorpher

RUN cd /polymorpher
RUN npm install
RUN npm run build:prod

ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV production
ENV PORT=8080

EXPOSE 8080
ENTRYPOINT ["npm", "run", "start"]