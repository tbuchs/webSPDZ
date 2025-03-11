
# Inspired from MP-SPDZ's Dockerfile:
# ...https://github.com/data61/MP-SPDZ/blob/master/Dockerfile

# To build for an x86-64 architecture, with g++, NTL (for HE), custom         #
# prep_dir & ssl_dir, and to use encrypted channels for 4 players:            #
#                                                                             #
#   docker build --tag mpspdz:buildenv \                                      #
#     --target buildenv \                                                     #
#     --build-arg arch=x86-64 \                                               #
#     --build-arg cxx=g++ \                                                   #
#     --build-arg use_ntl=1 \                                                 #
#     --build-arg prep_dir="/opt/prepdata" \                                  #
#     --build-arg ssl_dir="/opt/ssl"                                          #
#     --build-arg cryptoplayers=4 .                                           #


# Compile binaries
## GFP_MOD_SZ
### 2 ... 128-bit
### 4 ... 256-bit
GFP_MOD_SZ='2'

#ARCH='native'
CXX='clang++-14'
USE_NTL='0'
CRYPTO_PLAYERS='50'
export PLAYERS=${CRYPTO_PLAYERS}

PREP_DIR='Player-Data'
SSL_DIR='Player-Data'
mkdir -p ${PREP_DIR} #${SSL_DIR}
echo "PREP_DIR = '-DPREP_DIR=\"${PREP_DIR}/\"'" >> CONFIG.mine 
echo "SSL_DIR = '-DSSL_DIR=\"${SSL_DIR}/\"'" >> CONFIG.mine

echo "MOD = -DGFP_MOD_SZ=${GFP_MOD_SZ}" >> CONFIG.mine
#echo "ARCH = -march=${ARCH}" >> CONFIG.mine 
echo "CXX = ${CXX}" >> CONFIG.mine 
echo "USE_NTL = ${USE_NTL}" >> CONFIG.mine 
echo "MY_CFLAGS += -I/usr/local/include" >> CONFIG.mine 
echo "MY_LDLIBS += -Wl,-rpath -Wl,/usr/local/lib -L/usr/local/lib" >> CONFIG.mine 

## SSL Keys
./Scripts/setup-ssl.sh ${CRYPTO_PLAYERS} ${SSL_DIR}

## Make all protocol binaries
make clean-deps boost libote

make clean
echo "\nCOMPILING *ALL PROTOCOLS*\n"
make -j 8 all
#make -j 8 shamir
#make -j 8 mascot
cp *.x /usr/local/bin

# Example compilation with tutorial
echo 1 2 3 4 > Player-Data/Input-P0-0
echo 1 2 3 4 > Player-Data/Input-P1-0
./Scripts/compile-run.py -E mascot tutorial

