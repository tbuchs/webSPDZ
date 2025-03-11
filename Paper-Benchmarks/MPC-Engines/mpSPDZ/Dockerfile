FROM ubuntu:22.04

# ==============================================================================
# <VARIABLES_FOLDERS-n-FILES===================================================>
## From Host
# ARG HOST_DATA_DIR="MP-SPDZ-Docker"
# ARG HOST_DATA_DIR_SRC="$HOST_DATA_DIR/SRC_v0.3.7"
ARG HOST_DATA_DIR_SRC="mpSPDZ_SRC_v0.3.9_2024-June-20_18e934f36d4e807ce368a3cd7469c63de4f404e0"
ARG HOST_DATA_FILE_NETWORK_SETUP_LAN="setup-network_LAN.sh"
ARG HOST_DATA_FILE_NETWORK_SETUP_WAN="setup-network_WAN.sh"
#ARG HOST_DATA_FILE_CONFIG_MINE="$HOST_DATA_DIR/CONFIG.mine"
# TODO: check :: CONFIG.mine?

ARG FILE_INSTALL_MPSPDZ="install_MP-SPDZ_v0.3.9_2024-June-20.sh"
ARG FILE_INSTALL_DEPENDENCIES="install_dependencies.sh"

## Inside Container
ENV HOME="/home"
WORKDIR $HOME

ENV WORK_DIR="$HOME/MP-SPDZ"
## Within WORK_DIR
ARG CONT_HOST_SHARE_DIR_LOGS="Dock-Point/Logs" 
ARG CONT_HOST_SHARE_DIR_SHARE="Dock-Point/Share-Data"
# </VARIABLES_FOLDERS-n-FILES==================================================>
# ==============================================================================

# ==============================================================================
# <GENERAL-DEPENDENCIES-n-PACKAGES=============================================>
RUN apt update
RUN apt install -y bash
RUN apt install -y vim

# ADD $HOST_DATA_DIR/$FILE_INSTALL_DEPENDENCIES .
ADD $FILE_INSTALL_DEPENDENCIES .
RUN bash $FILE_INSTALL_DEPENDENCIES 
# </GENERAL-DEPENDENCIES-n-PACKAGES============================================>
# ==============================================================================

# ==============================================================================
# <MP-SPDZ>====================================================================>
RUN mkdir $WORK_DIR
WORKDIR $WORK_DIR
COPY $HOST_DATA_DIR_SRC "$WORK_DIR/"

# ADD $HOST_DATA_DIR/$FILE_INSTALL_MPSPDZ .
ADD $FILE_INSTALL_MPSPDZ .
RUN bash $FILE_INSTALL_MPSPDZ 
# RUN make -j 8 shamir
# RUN make -j 8 mascot
# RUN cp *.x /usr/local/bin
# RUN echo 1 2 3 4 > Player-Data/Input-P0-0
# RUN echo 1 2 3 4 > Player-Data/Input-P1-0
# RUN ./Scripts/compile-run.py -E mascot tutorial

# </MP-SPDZ>===================================================================>
# ==============================================================================

# ==============================================================================
# <NETWORK-CONFIG>=============================================================>
RUN apt install -y net-tools iproute2 
# COPY $HOST_DATA_FILE_NETWORK_SETUP_LAN $HOME
# COPY $HOST_DATA_FILE_NETWORK_SETUP_WAN $HOME
# RUN bash setup_network.sh 
# ...run when starting up the container; to have "cap_add=['NET_ADMIN']"
# </NETWORK-CONFIG>============================================================>
# ==============================================================================

# ==============================================================================
# <CONTAINER-CONFIG-n-STARTUP>=================================================>
### To provide log data to the host
RUN mkdir -p $WORK_DIR/$CONT_HOST_SHARE_DIR_LOGS
### To share certain player data with the host
RUN mkdir -p $WORK_DIR/$CONT_HOST_SHARE_DIR_SHARE
### Make sure to use "login" shell when running container
ENTRYPOINT ["/usr/bin/env", "bash", "-l", "-c"]
# </CONTAINER-CONFIG-n-STARTUP>================================================>
# ==============================================================================

