FROM ubuntu:24.04

# ==============================================================================
# <VARIABLES_FOLDERS-n-FILES===================================================>
## From Host
ARG HOST_DATA_DIR_SRC="SRC_2024-Feb_5b72f19"
# ARG HOST_DATA_FILE_NETWORK_SETUP_LAN="setup-network_LAN.sh"
# ARG HOST_DATA_FILE_NETWORK_SETUP_WAN="setup-network_WAN.sh"

ARG FILE_INSTALL_MPyCweb="install_MPyC-Web_2024-Feb_5b72f19.sh"

## Inside Container
ENV HOME="/home"
ENV WORK_DIR="$HOME/MPyC-Web"
WORKDIR $HOME
ARG CONT_SHARE_DIR_LOGS="Dock-Point/Logs" 
ARG CONT_SHARE_DIR_DATA="Dock-Point/Share-Data"

# </VARIABLES_FOLDERS-n-FILES==================================================>


# ==============================================================================
# <GENERAL-DEPENDENCIES-n-PACKAGES=============================================>
RUN apt update
RUN apt install -y bash
RUN apt install -y vim
# </GENERAL-DEPENDENCIES-n-PACKAGES============================================>


# ==============================================================================
# <MPyC-Web====================================================================>
# COPY $HOST_DATA_DIR_SRC $WORK_DIR
RUN apt install -y git
RUN git clone https://github.com/e-nikolov/mpyc-web $WORK_DIR

ADD $FILE_INSTALL_MPyCweb $HOME
RUN bash $FILE_INSTALL_MPyCweb
# </MPyC-Web===================================================================>


# ==============================================================================
# <NETWORK-CONFIG>=============================================================>
# RUN apt install -y net-tools iproute2 
# COPY $HOST_DATA_FILE_NETWORK_SETUP_LAN $HOME
# COPY $HOST_DATA_FILE_NETWORK_SETUP_WAN $HOME
# RUN bash setup_network.sh 
# ...run when starting up the container; to have "cap_add=['NET_ADMIN']"
# </NETWORK-CONFIG>============================================================>


# ==============================================================================
# <CONTAINER-CONFIG-n-STARTUP>=================================================>
### To provide log data to the host
RUN mkdir -p $HOME/$CONT_SHARE_DIR_LOGS
### To share certain (party) data with the host
RUN mkdir -p $HOME/$CONT_SHARE_DIR_DATA
### Make sure to use "login" shell when running container
ENTRYPOINT ["/usr/bin/env", "bash", "-l", "-c"]
# </CONTAINER-CONFIG-n-STARTUP>================================================>

