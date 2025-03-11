/*
 * Rep3Shuffler.h
 *
 */

#ifndef PROTOCOLS_REP3SHUFFLER_H_
#define PROTOCOLS_REP3SHUFFLER_H_

#include "SecureShuffle.h"

template<class T>
class Rep3Shuffler
{
public:
    typedef array<vector<int>, 2> shuffle_type;
    typedef ShuffleStore<shuffle_type> store_type;

private:
    SubProcessor<T>& proc;

public:
    Rep3Shuffler(vector<T>& a, size_t n, int unit_size, size_t output_base,
            size_t input_base, SubProcessor<T>& proc);

    Rep3Shuffler(SubProcessor<T>& proc);

    int generate(int n_shuffle, store_type& store);

    void apply(vector<T>& a, size_t n, int unit_size, size_t output_base,
            size_t input_base, shuffle_type& shuffle, bool reverse);

    void inverse_permutation(vector<T>& stack, size_t n, size_t output_base,
            size_t input_base);
};

#endif /* PROTOCOLS_REP3SHUFFLER_H_ */
