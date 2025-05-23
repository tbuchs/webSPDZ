/*
 * ShamirMC.h
 *
 */

#ifndef PROTOCOLS_SHAMIRMC_H_
#define PROTOCOLS_SHAMIRMC_H_

#include "MAC_Check_Base.h"
#include "Protocols/ShamirShare.h"
#include "Machines/ShamirMachine.h"
#include "Tools/Bundle.h"

/**
 * Shamir secret sharing opening protocol (indirect communication)
 */
template<class T>
class IndirectShamirMC : public MAC_Check_Base<T>
{
    vector<octetStream> oss;
    octetStream os;

public:
    IndirectShamirMC(typename T::mac_key_type = {}, int = 0, int = 0) {}
    ~IndirectShamirMC() {}

    virtual void exchange(Player& P);
};

/**
 * Shamir secret sharing opening protocol (direct communication)
 */
template<class T>
class ShamirMC : public IndirectShamirMC<T>
{
    typedef typename T::open_type open_type;
    typedef typename T::open_type::Scalar rec_type;
    vector<typename T::open_type::Scalar> reconstruction;

    ShamirMC(const ShamirMC&);

    void finalize(vector<typename T::open_type>& values, const vector<T>& S);

protected:
    Bundle<octetStream>* os;
    Player* player;
    int threshold;

    void prepare(const vector<T>& S, Player& P);

public:
    ShamirMC(int threshold = 0);

    // emulate MAC_Check
    ShamirMC(const typename T::mac_key_type& _, int __ = 0, int ___ = 0) : ShamirMC()
    { (void)_; (void)__; (void)___; }

    // emulate Direct_MAC_Check
    ShamirMC(const typename T::mac_key_type& _, Names& ____, int __ = 0, int ___ = 0) :
        ShamirMC()
    { (void)_; (void)__; (void)___; (void)____; }

    virtual ~ShamirMC();

    void POpen(vector<typename T::open_type>& values,const vector<T>& S,Player& P);
    void POpen_Begin(vector<typename T::open_type>& values,const vector<T>& S,Player& P);
    void POpen_End(vector<typename T::open_type>& values,const vector<T>& S,Player& P);

    virtual void init_open(Player& P, int n = 0);
    virtual void prepare_open(const T& secret, int = -1);
    virtual void exchange(Player& P);
    virtual typename T::open_type finalize_raw();

    void Check(Player& P) { (void)P; }

    vector<rec_type> get_reconstruction(Player& P, int n = 0);
    open_type reconstruct(const vector<open_type>& shares);
};

#endif /* PROTOCOLS_SHAMIRMC_H_ */
