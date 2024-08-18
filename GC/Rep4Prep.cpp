/*
 * Rep4Prep.cpp
 *
 */

#include "Rep4Prep.h"

#include "Protocols/Rep4.hpp"
#include "Protocols/Rep4Input.hpp"
#include "Protocols/ReplicatedPrep.hpp"

namespace GC
{

Rep4Prep::Rep4Prep(DataPositions& usage, int) :
        BufferPrep<Rep4Secret>(usage)
{
}

void Rep4Prep::set_protocol(Rep4Secret::Protocol& protocol)
{
    this->P = &protocol.P;
}

void Rep4Prep::buffer_bits()
{
    assert(P);
    Rep4<Rep4Secret> proto(*P);
    for (int i = 0; i < OnlineOptions::singleton.batch_size; i++)
        this->bits.push_back(proto.get_random() & 1);
}

} /* namespace GC */
