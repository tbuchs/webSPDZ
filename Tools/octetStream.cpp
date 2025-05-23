
#include <fcntl.h>
#include <sodium.h>

#include "octetStream.h"
#include <string.h>
#include "Networking/sockets.h"
#include "Networking/ssl_sockets.h"
#include "Tools/Exceptions.h"
#include "Networking/data.h"
#include "Networking/Player.h"
#include "Networking/Exchanger.h"
#include "Math/bigint.h"
#include "Tools/time-func.h"
#include "Tools/FlexBuffer.h"


void octetStream::reset()
{
    data = 0;
    len = mxlen = ptr = 0;
    chunked = 0;
}

void octetStream::clear()
{
    if (data)
        delete[] data;
    data = 0;
    len = mxlen = ptr = 0;
}

void octetStream::assign(const octetStream& os)
{
  if (os.len>=mxlen)
    {
      if (data)
        delete[] data;
      mxlen=os.mxlen;  
      data=new octet[mxlen];
    }
  len=os.len;
  memcpy(data,os.data,len*sizeof(octet));
  ptr=os.ptr;
  bits = os.bits;
  chunked = os.chunked;
}


octetStream::octetStream(size_t maxlen, int chunked)
{
  mxlen=maxlen; len=0; ptr=0;
  data=new octet[mxlen];
  this->chunked = chunked;
}

octetStream::octetStream(size_t len, const octet* source) :
    octetStream(len)
{
  append(source, len);
}

octetStream::octetStream(const string& other) :
    octetStream(other.size(), (const octet*)other.data())
{
}

octetStream::octetStream(const octetStream& os)
{
  mxlen=os.mxlen;
  len=os.len;
  data=new octet[mxlen];
  memcpy(data,os.data,len*sizeof(octet));
  ptr=os.ptr;
  bits = os.bits;
  chunked = os.chunked;
}

octetStream::octetStream(FlexBuffer& buffer)
{
  mxlen = buffer.capacity();
  len = buffer.size();
  data = (octet*)buffer.data();
  ptr = buffer.ptr - buffer.data();
  buffer.reset();
}


string octetStream::str() const
{
  return string((char*) get_data(), get_length());
}


void octetStream::hash(octetStream& output) const
{
  assert(output.mxlen >= crypto_generichash_blake2b_BYTES_MIN);
  crypto_generichash(output.data, crypto_generichash_BYTES_MIN, data, len, NULL, 0);
  output.len=crypto_generichash_BYTES_MIN;
}


octetStream octetStream::hash() const
{
  octetStream h(crypto_generichash_BYTES_MIN);
  hash(h);
  return h;
}


bigint octetStream::check_sum(int req_bytes) const
{
  auto hash = new unsigned char[req_bytes];
  crypto_generichash(hash, req_bytes, data, len, NULL, 0);

  bigint ans;
  bigintFromBytes(ans,hash,req_bytes);
  // cout << ans << "\n";
  delete[] hash;
  return ans;
}


bool octetStream::equals(const octetStream& a) const
{
  if (len!=a.len) { return false; }
  return memcmp(data, a.data, len) == 0;
}


void octetStream::append_random(size_t num)
{
  randombytes_buf(append(num), num);
}


void octetStream::concat(const octetStream& os)
{
  memcpy(append(os.len), os.data, os.len*sizeof(octet));
}


void octetStream::store_bytes(octet* x, const size_t l)
{
  encode_length(append(4), l, 4);
  memcpy(append(l), x, l*sizeof(octet));
}

void octetStream::get_bytes(octet* ans, size_t& length)
{
  auto rec_length = get_int(4);
  if (rec_length != length)
    throw runtime_error("unexpected length");
  memcpy(ans, consume(length), length * sizeof(octet));
}

void octetStream::store(int l)
{
  encode_length(append(4), l, 4);
}


void octetStream::get(int& l)
{
  l = get_int(4);
}


void octetStream::store(const bigint& x)
{
  size_t num=numBytes(x);
  *append(1) = x < 0;
  encode_length(append(4), num, 4);
  bytesFromBigint(append(num), x, num);
}


void octetStream::get(bigint& ans)
{
  int sign = *consume(1);
  if (sign!=0 && sign!=1) { throw bad_value(); }

  long length = get_int(4);

  if (length!=0)
    {
      bigintFromBytes(ans, consume(length), length);
      if (sign)
        mpz_neg(ans.get_mpz_t(), ans.get_mpz_t());
    }
  else
    ans=0;
}


void octetStream::store(const string& str)
{
  store(str.length());
  append((const octet*) str.data(), str.length());
}


void octetStream::get(string& str)
{
  size_t size;
  get(size);
  str.assign((const char*) consume(size), size);
}


template<class T>
void octetStream::exchange(T send_socket, T receive_socket, octetStream& receive_stream) const
{
  Exchanger<T> exchanger(send_socket, *this, receive_socket, receive_stream);
  while (exchanger.round())
    ;
}


void octetStream::input(istream& s)
{
  size_t size;
  s.read((char*)&size, sizeof(size));
  if (not s.good())
    throw IO_Error("not enough data");
  resize_min(size);
  s.read((char*)data, size);
  len = size;
  if (not s.good())
    throw IO_Error("not enough data");
}

void octetStream::output(ostream& s)
{
  s.write((char*)&len, sizeof(len));
  s.write((char*)data, len);
}

ostream& operator<<(ostream& s,const octetStream& o)
{
  for (size_t i=0; i<o.len; i++)
    { int t0=o.data[i]&15;
      int t1=o.data[i]>>4;
      s << hex << t1 << t0 << dec;
    }
  return s;
}

octetStreams::octetStreams(const Player& P)
{
  reset(P);
}

void octetStreams::reset(const Player& P)
{
  resize(P.num_players());
  for (auto& o : *this)
    o.reset_write_head();
}

template void octetStream::exchange(int, int, octetStream&) const;
template void octetStream::exchange(ssl_socket*, ssl_socket*, octetStream&) const;
