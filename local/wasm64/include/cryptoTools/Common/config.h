#pragma once


// use the miracl library for curves
/* #undef ENABLE_MIRACL */

// use the relic library for curves
/* #undef ENABLE_RELIC */

// use the libsodium library for curves
/* #undef ENABLE_SODIUM */

// does the libsodium library support noclamp operations on Montgomery curves?
/* #undef SODIUM_MONTGOMERY */

// compile the circuit library
/* #undef ENABLE_CIRCUITS */

// include the full GSL header (C++14). If not defined, uses gsl_lite (c++11)
#define ENABLE_FULL_GSL ON

// defined if we should use cpp 14 and undefined means cpp 11
#define ENABLE_CPP_14 ON

// enables the use of assembly based SHA1
/* #undef ENABLE_NASM */

// Turn on Channel logging for debugging.
/* #undef ENABLE_NET_LOG */


// enable the wolf ssl socket layer.
/* #undef ENABLE_WOLFSSL */

// enable integration with boost for networking.
#define ENABLE_BOOST ON

// enable the use of intel SSE instructions.
#define ENABLE_SSE ON

// enable the use of intel AVX instructions.
/* #undef ENABLE_AVX */

// enable the use of the portable AES implementation.
/* #undef ENABLE_PORTABLE_AES */

#if (defined(_MSC_VER) || defined(__SSE2__)) && defined(ENABLE_SSE)
#define ENABLE_SSE_BLAKE2 ON
#define OC_ENABLE_SSE2 ON
#endif

#if (defined(_MSC_VER) || defined(__PCLMUL__)) && defined(ENABLE_AVX)
#define OC_ENABLE_PCLMUL
#endif

#if (defined(_MSC_VER) || defined(__AES__)) && defined(ENABLE_AVX)
#define OC_ENABLE_AESNI ON
#else
#define OC_ENABLE_PORTABLE_AES ON
#endif

#if (defined(_MSC_VER) || defined(__AVX2__)) && defined(ENABLE_AVX)
#define OC_ENABLE_AVX2 ON
#endif


#ifdef __aarch64__
#define SIMDE_X86_AVX_ENABLE_NATIVE_ALIASES
#define SIMDE_X86_AVX2_ENABLE_NATIVE_ALIASES
#define SIMDE_X86_SSE2_ENABLE_NATIVE_ALIASES
#define SIMDE_X86_SSE4_1_ENABLE_NATIVE_ALIASES
#define SIMDE_X86_PCLMUL_ENABLE_NATIVE_ALIASES
#include <simde/simde/x86/clmul.h>
#include <simde/simde/x86/avx2.h>
#define OC_ENABLE_AVX2 ON
#define OC_ENABLE_PCLMUL
#define OC_ENABLE_SSE2 ON
#define OC_ENABLE_SSE ON
#define OC_ENABLE_AVX ON
#else
#ifdef OC_ENABLE_SSE2
#include <emmintrin.h>
#include <smmintrin.h>
#endif
#ifdef OC_ENABLE_PCLMUL
#include <wmmintrin.h>
#endif
#endif
