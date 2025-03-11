/*
 * DiskVector.h
 *
 */

#ifndef TOOLS_DISKVECTOR_H_
#define TOOLS_DISKVECTOR_H_

#include <boost/iostreams/device/mapped_file.hpp>
#include <boost/filesystem.hpp>

class DiskVectorBase
{
protected:
    boost::iostreams::mapped_file file;
    boost::filesystem::path path;

public:
    ~DiskVectorBase()
    {
        boost::filesystem::remove(path);
    }

    void init(size_t byte_size);
};

template<class T>
class DiskVector : DiskVectorBase
{
    size_t size_;
    T* data_;

public:
    DiskVector() : size_(0), data_(0)
    {
    }

    size_t size() const
    {
        return size_;
    }

    void resize(size_t new_size)
    {
        auto byte_size = new_size * sizeof(T);
        init(byte_size);
        size_ = new_size;
        data_ = (T*) file.data();
    }

    T* data()
    {
        return data_;
    }

    const T* data() const
    {
        return data_;
    }

    T& operator[](size_t index)
    {
        return data_[index];
    }

    const T& operator[](size_t index) const
    {
        return data_[index];
    }

    T& at(size_t index)
    {
        assert(index <= size_);
        return data_[index];
    }

    const T& at(size_t index) const
    {
        assert(index <= size_);
        return data_[index];
    }
};

#endif /* TOOLS_DISKVECTOR_H_ */
