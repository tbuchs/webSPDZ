/*
 * malicious-shamir-party.cpp
 *
 */

#include "Machines/ShamirMachine.h"
#include "Protocols/MaliciousShamirShare.h"
#include "Machines/MalRep.hpp"

#include "ShamirMachine.hpp"

int main(int argc, const char** argv)
{
    ShamirMachineSpec<MaliciousShamirShare>(argc, argv);
    emscripten_force_exit(0);
}
