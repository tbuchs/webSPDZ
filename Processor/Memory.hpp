#include "Processor/Memory.h"
#include "Processor/Instruction.h"

#include <fstream>

template<class T>
template<class U>
void MemoryPart<T>::indirect_read(const Instruction& inst,
    vector<T>& regs, const U& indices)
{
  size_t n = inst.get_size();
  auto dest = regs.begin() + inst.get_r(0);
  auto start = indices.begin() + inst.get_r(1);
#ifdef CHECK_SIZE
  assert(start + n <= indices.end());
  assert(dest + n <= regs.end());
#endif
  long size = this->size();
  const T* data = this->data();
  for (auto it = start; it < start + n; it++)
    {
#ifndef NO_CHECK_SIZE
      if (*it >= size)
        throw overflow(T::type_string() + " memory read", it->get(), size);
#endif
      *dest++ = data[it->get()];
    }
}

template<class T>
template<class U>
void MemoryPart<T>::indirect_write(const Instruction& inst,
    vector<T>& regs, const U& indices)
{
  size_t n = inst.get_size();
  auto source = regs.begin() + inst.get_r(0);
  auto start = indices.begin() + inst.get_r(1);
#ifdef CHECK_SIZE
  assert(start + n <= indices.end());
  assert(source + n <= regs.end());
#endif
  long size = this->size();
  T* data = this->data();
  for (auto it = start; it < start + n; it++)
    {
#ifndef NO_CHECK_SIZE
      if (*it >= size)
        throw overflow(T::type_string() + " memory write", it->get(), size);
#endif
      data[it->get()] = *source++;
    }
}

template<class T>
void Memory<T>::minimum_size(RegType secret_type, RegType clear_type,
    const Program &program, const string& threadname)
{
  (void) threadname;
  MS.minimum_size(program.direct_mem(secret_type));
  MC.minimum_size(program.direct_mem(clear_type));
}

template<class T>
void MemoryPart<T>::minimum_size(size_t size)
{
  try
  {
      if (size > this->size())
          this->resize(size);
#ifdef DEBUG_MEMORY_SIZE
      cerr << T::type_string() << " memory has now size " << this->size() << endl;
#endif
  }
  catch (bad_alloc&)
  {
      throw insufficient_memory(size, T::type_string());
  }
}

template<class T>
Memory<T>::Memory() :
    MS(
        *(OnlineOptions::singleton.disk_memory.size() ?
            static_cast<MemoryPart<T>*>(new MemoryPartImpl<T, DiskVector>) :
            static_cast<MemoryPart<T>*>(new MemoryPartImpl<T, CheckVector>)))
{
}

template<class T>
Memory<T>::~Memory()
{
  delete &MS;
}

template<class T>
ostream& operator<<(ostream& s,const Memory<T>& M)
{
  s << M.MS.size() << endl;
  s << M.MC.size() << endl;

#ifdef OUTPUT_HUMAN_READABLE_MEMORY
  for (unsigned int i=0; i<M.MS.size(); i++)
    { M.MS[i].output(s,true); s << endl; }
  s << endl;

  for (unsigned int i=0; i<M.MC.size(); i++)
    {  M.MC[i].output(s,true); s << endl; }
  s << endl;
#else
  for (unsigned int i=0; i<M.MS.size(); i++)
    { M.MS[i].output(s,false); }

  for (unsigned int i=0; i<M.MC.size(); i++)
    { M.MC[i].output(s,false); }
#endif

  return s;
}


template<class T>
istream& operator>>(istream& s,Memory<T>& M)
{
  int len;

  s >> len;  
  M.MS.minimum_size(len);
  s >> len;
  M.MC.minimum_size(len);
  s.seekg(1, istream::cur);

  for (unsigned int i=0; i<M.MS.size(); i++)
    { M.MS[i].input(s,false);  }

  for (unsigned int i=0; i<M.MC.size(); i++)
    { M.MC[i].input(s,false); }

  return s;
}
