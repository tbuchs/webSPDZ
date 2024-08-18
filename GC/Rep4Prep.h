/*
 * Rep4Prep.h
 *
 */

#ifndef GC_REP4PREP_H_
#define GC_REP4PREP_H_

#include "Rep4Secret.h"
#include "PersonalPrep.h"
#include "Protocols/ReplicatedPrep.h"

namespace GC
{

class Rep4Prep : public BufferPrep<Rep4Secret>
{
public:
    Rep4Prep(DataPositions& usage, int _ = -1);

    void set_protocol(Rep4Secret::Protocol& protocol);

    void buffer_bits();
};

} /* namespace GC */

#endif /* GC_REP4PREP_H_ */
