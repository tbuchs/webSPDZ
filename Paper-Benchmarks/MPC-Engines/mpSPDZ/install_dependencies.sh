
# Install required system packages
apt install -y \
	automake \
	build-essential \
	clang-11 \
	cmake \
	gcc \
	git \
	libboost-dev \
	libboost-thread-dev \
	libclang-dev \
	libgmp-dev \
	libntl-dev \
	libsodium-dev \
	libssl-dev \
	libtool \
	make \
	python3 \
	texinfo \
	yasm \

apt upgrade -y clang
