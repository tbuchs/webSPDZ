FROM ubuntu:22.04
ENV WORK_DIR="$HOME/webSPDZ-64"
ARG HOST_DATA_DIR="webSPDZ-64-Docker"
ARG HOST_DATA_DIR_SRC="$HOST_DATA_DIR/src"

## Inside Container
ENV HOME="/home"
WORKDIR $HOME

RUN apt-get update && apt-get upgrade -y && apt-get install -y wget
RUN apt install -y bash
RUN apt install -y vim
RUN apt install -y nodejs
RUN apt install -y npm
RUN npm install websocket
RUN apt install -y python3
RUN apt install -y python3-pip
RUN pip install selenium
# Network config
RUN apt install -y net-tools iproute2 lsof libasound2

RUN apt-get update --fix-missing

## Install Firefox
RUN apt install -y software-properties-common && \
    apt install -y libpci-dev && \
    add-apt-repository -y ppa:mozillateam/ppa && \
    apt remove -y software-properties-common && \
    apt autoclean -y && \
    apt autoremove -y && \
    rm -rf /var/lib/apt/lists/*

#RUN wget https://ftp.mozilla.org/pub/firefox/nightly/2024/07/2024-07-01-09-45-48-mozilla-central-l10n/firefox-129.0a1.de.linux-x86_64.tar.bz2
#RUN tar xjf firefox-129.0a1.de.linux-x86_64.tar.bz2
#RUN mv firefox /opt
#RUN ln -s /opt/firefox/ /usr/local/bin/firefox

RUN install -d -m 0755 /etc/apt/keyrings
RUN wget -q https://packages.mozilla.org/apt/repo-signing-key.gpg -O /etc/apt/keyrings/packages.mozilla.org.asc
RUN echo "deb [signed-by=/etc/apt/keyrings/packages.mozilla.org.asc] https://packages.mozilla.org/apt mozilla main" | tee -a /etc/apt/sources.list.d/mozilla.list > /dev/null
RUN apt-get update
RUN apt-get install -y firefox-nightly
ARG BUILD_DATE=1
#RUN wget -q -O nightly.tar.bz 'https://download.mozilla.org/?product=firefox-nightly-latest-ssl&os=linux64&lang=en-US' \
#&& tar xjf nightly.tar.bz \
#&& rm -f nightly.tar.bz

# Install Firefox and xauth
#RUN apt update && \
#    apt install -y --no-install-recommends firefox xauth && \
#    rm -rf /var/lib/apt/lists/*

RUN mkdir $WORK_DIR
WORKDIR $WORK_DIR
COPY $HOST_DATA_DIR_SRC "$WORK_DIR/"
ENTRYPOINT ["/usr/bin/env", "bash", "-l", "-c"]
