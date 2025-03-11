/*
 * DiskVectorBase.cpp
 *
 */

#include "DiskVector.h"
#include "Processor/OnlineOptions.h"

#include <fstream>

void sigbus_handler(int)
{
    cerr << "Received SIGBUS. This is most likely due to missing space "
            << "for the on-disk memory on "
            << OnlineOptions::singleton.disk_memory << "." << endl;
    exit(1);
}

void DiskVectorBase::init(size_t byte_size)
{
    if (file.is_open())
        throw runtime_error("resizing of disk memory not implemented");
    else
    {
        path = boost::filesystem::unique_path(
                (boost::filesystem::path(OnlineOptions::singleton.disk_memory)
                        / std::string("%%%%-%%%%-%%%%-%%%%")).native());

        std::ofstream f(path.native());
        f.close();
    }

    if (truncate(path.native().c_str(), byte_size))
        throw std::runtime_error(
                "cannot allocate " + std::to_string(byte_size) + " bytes in "
                        + path.native() + ": " + strerror(errno));

    file.open(path, boost::iostreams::mapped_file::readwrite, byte_size);
    assert(file.size() == byte_size);

    boost::filesystem::remove(path);

    signal(SIGBUS, sigbus_handler);
}
