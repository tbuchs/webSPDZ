FROM node:22.1-alpine3.19
#FROM node:19.7.0-alpine3.16
WORKDIR /root
RUN apk add \
  git \
  vim \
  bash 
  #boost-dev \
  #python3 \
  #make
RUN npm update -g npm

WORKDIR /root/jiff
# RUN git clone https://github.com/multiparty/jiff .
COPY "SRC_2024-June-06" "$WORKDIR"
#RUN git checkout 8ea565d
RUN npm install -g jiff-mpc
#RUN npm install

#ADD *.sh ./
#RUN bash vim.sh

# install example app
ADD app/ /root/app
WORKDIR /root/app
RUN rm package-lock.json
RUN npm install

# install inner-product app (based on example)
ADD app_innerprod/ /root/app_innerprod
WORKDIR /root/app_innerprod
RUN rm package-lock.json
RUN npm install
## batch server to reduce log output
ADD server-patch_handlers.js /root/app_innerprod/node_modules/jiff-mpc/lib/server/handlers.js

#WORKDIR /root/jiff
ADD programs/ /root/programs
RUN cp -r /root/programs/* /root/jiff/demos/

# Add Dock-Point
RUN mkdir -p /root/Dock-Point/Share-Data
RUN mkdir -p /root/Dock-Point/Logs

# To fix potential heap-out-of-memory issues with, e.g., large input sizes
ENV GENERATE_SOURCEMAP=false
# (should be) in MB:
ENV NODE_OPTIONS=--max-old-space-size=16000

#ENTRYPOINT /bin/bash
ENTRYPOINT ["/usr/bin/env", "bash", "-l", "-c"]

