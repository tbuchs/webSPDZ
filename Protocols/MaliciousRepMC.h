/*
 * MaliciousRepMC.h
 *
 */

#ifndef PROTOCOLS_MALICIOUSREPMC_H_
#define PROTOCOLS_MALICIOUSREPMC_H_

#include "ReplicatedMC.h"

template<class T>
class MaliciousRepMC : public ReplicatedMC<T>
{
protected:
    typedef ReplicatedMC<T> super;

public:
    virtual void POpen(vector<typename T::open_type>& values,
            const vector<T>& S, Player& P);
    virtual void POpen_Begin(vector<typename T::open_type>& values,
            const vector<T>& S, Player& P);
    virtual void POpen_End(vector<typename T::open_type>& values,
            const vector<T>& S, Player& P);

    virtual void Check(Player& P);

    MaliciousRepMC& get_part_MC()
    {
        return *this;
    }
};

/**
 * 3-party replicated opening with checking via hash
 */
template<class T>
class HashMaliciousRepMC : public MaliciousRepMC<T>
{
    Hash hash;

    octetStream os;

    bool needs_checking;

    void reset();
    void update();

    void finalize(const vector<typename T::open_type>& values);

public:
    // emulate MAC_Check
    HashMaliciousRepMC(const typename T::mac_key_type& _, int __ = 0, int ___ = 0) : HashMaliciousRepMC()
    { (void)_; (void)__; (void)___; }

    // emulate Direct_MAC_Check
    HashMaliciousRepMC(const typename T::mac_key_type& _, Names& ____, int __ = 0, int ___ = 0) : HashMaliciousRepMC()
    { (void)_; (void)__; (void)___; (void)____; }

    HashMaliciousRepMC();
    ~HashMaliciousRepMC();

    void POpen(vector<typename T::open_type>& values,const vector<T>& S, Player& P);
    void POpen_End(vector<typename T::open_type>& values,const vector<T>& S, Player& P);

    virtual typename T::open_type finalize_raw();

    void CheckFor(const typename T::open_type& value, const vector<T>& shares, Player& P);

    void Check(Player& P);
};

template<class T>
class CommMaliciousRepMC : public MaliciousRepMC<T>
{
    vector<octetStream> os;

public:
    void POpen(vector<typename T::clear>& values, const vector<T>& S,
            Player& P);
    void POpen_Begin(vector<typename T::clear>& values, const vector<T>& S,
            Player& P);
    void POpen_End(vector<typename T::clear>& values, const vector<T>& S,
            Player& P);

    void Check(Player& P);
};

#endif /* PROTOCOLS_MALICIOUSREPMC_H_ */
