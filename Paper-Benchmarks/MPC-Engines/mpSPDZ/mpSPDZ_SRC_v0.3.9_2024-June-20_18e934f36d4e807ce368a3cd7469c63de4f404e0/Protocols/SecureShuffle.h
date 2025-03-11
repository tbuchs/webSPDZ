/*
 * SecureShuffle.h
 *
 */

#ifndef PROTOCOLS_SECURESHUFFLE_H_
#define PROTOCOLS_SECURESHUFFLE_H_

#include <vector>
using namespace std;

#include "Tools/Lock.h"

template<class T> class SubProcessor;

template<class T>
class ShuffleStore
{
    typedef T shuffle_type;

    deque<shuffle_type> shuffles;

    Lock store_lock;

    void lock();
    void unlock();

public:
    int add();
    shuffle_type& get(int handle);
    void del(int handle);
};

template<class T>
class SecureShuffle
{
public:
    typedef vector<vector<vector<T>>> shuffle_type;
    typedef ShuffleStore<shuffle_type> store_type;

private:
    SubProcessor<T>& proc;
    vector<T> to_shuffle;
    vector<vector<T>> config;
    vector<T> tmp;
    int unit_size;

    size_t n_shuffle;
    bool exact;

    /**
     * Generates and returns a newly generated random permutation. This permutation is generated locally.
     *
     * @param n The size of the permutation to generate.
     * @return A vector representing a permutation, a shuffled array of integers 0 through n-1.
     */
    vector<int> generate_random_permutation(int n);

    /**
     * Configure a shared waksman network from a permutation known only to config_player.
     * Note that although the configuration bits of the waksman network are secret shared,
     * the player that generated the permutation (config_player) knows the value of these bits.
     *
     * A permutation is a mapping represented as a vector.
     * Each item in the vector represents the output of mapping(i) where i is the index of that item.
     *      e.g. [2, 4, 0, 3, 1] -> perm(1) = 4
     *
     * @param config_player The player tasked with generating the random permutation from which to configure the waksman network.
     * @param n_shuffle The size of the permutation to generate.
     */
    void configure(int config_player, vector<int>* perm, int n);
    void player_round(int config_player);

    void waksman(vector<T>& a, int depth, int start);
    void cond_swap(T& x, T& y, const T& b);

    void iter_waksman(bool reverse = false);
    void waksman_round(int size, bool inwards, bool reverse);

    void pre(vector<T>& a, size_t n, size_t input_base);
    void post(vector<T>& a, size_t n, size_t input_base);

public:
    SecureShuffle(vector<T>& a, size_t n, int unit_size,
            size_t output_base, size_t input_base, SubProcessor<T>& proc);

    SecureShuffle(SubProcessor<T>& proc);

    int generate(int n_shuffle, store_type& store);

    /**
     *
     * @param a The vector of registers representing the stack // TODO: Is this correct?
     * @param n The size of the input vector to shuffle
     * @param unit_size Determines how many vector items constitute a single block with regards to permutation:
     *                  i.e. input vector [1,2,3,4] with <code>unit_size=2</code> under permutation map [1,0]
     *                  would result in [3,4,1,2]
     * @param output_base The starting address of the output vector (i.e. the location to write the inverted permutation to)
     * @param input_base The starting address of the input vector (i.e. the location from which to read the permutation)
     * @param shuffle The preconfigured waksman network (shuffle) to use
     * @param reverse Boolean indicating whether to apply the inverse of the permutation
     * @see SecureShuffle::generate for obtaining a shuffle handle
     */
    void apply(vector<T>& a, size_t n, int unit_size, size_t output_base,
            size_t input_base, shuffle_type& shuffle, bool reverse);

    /**
     * Calculate the secret inverse permutation of stack given secret permutation.
     *
     * This method is given in [1], based on stack technique in [2]. It is used in the Compiler (high-level) implementation of Square-Root ORAM.
     *
     * [1] Samee Zahur, Xiao Wang, Mariana Raykova, Adrià Gascón, Jack Doerner, David Evans, and Jonathan Katz. 2016. Revisiting Square Root ORAM: Efficient Random Access in Multi-Party Computation. In IEEE S&P.
     * [2] Ivan Damgård, Matthias Fitzi, Eike Kiltz, Jesper Buus Nielsen, and Tomas Toft. Unconditionally Secure Constant-rounds Multi-Party Computation for Equality, Comparison, Bits and Exponentiation. In Theory of Cryptography, 2006.
     *
     * @param stack The vector or registers representing the stack (?)
     * @param n The size of the input vector for which to calculate the inverse permutation
     * @param output_base The starting address of the output vector (i.e. the location to write the inverted permutation to)
     * @param input_base The starting address of the input vector (i.e. the location from which to read the permutation)
     */
    void inverse_permutation(vector<T>& stack, size_t n, size_t output_base, size_t input_base);
};

#endif /* PROTOCOLS_SECURESHUFFLE_H_ */
