The Journey of a Program
========================

In this section, we will demonstrate the life cycle of a high-level
program in MP-SPDZ.

Consider the following program::

  print_ln('%s', sint(123).reveal())

It entails three steps: creating a constant secret sharing, revealing
it to cleartext, and outputting it. The compilation will not execute
any of this. Instead, it will create a description in a format
specific to MP-SPDZ. For example,
:py:func:`~Compiler.types.sint.reveal` triggers a call to the
constructor of :py:obj:`~Compiler.instructions.asm_open`, which will
add an object thereof to a list of instructions.

Run the following to retrieve the human-readable representation of the
computation::

  echo print_ln('%s', sint(123).reveal()) > Programs/Source/journey.py
  ./compile.py -a debug journey

This will create :file:`debug-journey-0` with the
following content::

  # journey-0--0
  ldsi s0, 123 # 0
  asm_open 3, True, c0, s0 # 1
  print_reg_plain c0 # 2
  print_char 10 # 3
  use 0, 7, 1 # 4
  # journey-0-memory-usage-1
  ldmc c0, 8191 # 5
  gldmc cg0, 8191 # 6
  ldmint ci0, 8191 # 7
  ldms s0, 8191 # 8
  gldms sg0, 8191 # 9
  active True # 10

The first block corresponds mostly to the program whereas the second
block is more generic. More specifically::

  ldsi s0, 123 # 0

:py:class:`~Compiler.instructions.ldsi` loads constant values to
secret registers, in this case 123 to the register :obj:`s0`.

.. code::

  asm_open 3, True, c0, s0 # 1

:py:class:`~Compiler.instructions.asm_open` reveals values in secret
registers to be stored in cleartext registers, in this case the
content of :obj:`s0` to :obj:`c0`. The :obj:`True` argument triggers a
correctness check in protocols where it is available, and the 3
indicates the number of arguments to follow as the instruction is
batchable, that is, it can execute any number of

.. code::

  print_reg_plain c0 # 2

:py:class:`~Compiler.instructions.print_reg_plain` outputs constant
values to the console or a file, in this case the register :obj:`c0`.

.. code::

  print_char 10 # 3

:py:class:`~Compiler.instructions.print_char` outputs a character to
the console or a file, in this case the ASCII code for a new line.

.. code::

  use 0, 7, 1 # 4

:py:class:`~Compiler.instructions.use` indicates the usage of
preprocessing information or similar. This allows the virtual machine
to account for resources before actually executing the program. This
particular call indicates 1 opening (7) of sint (0). You can see the
codes in :py:obj:`data_type` and :py:obj:`field_types` at the beginning
of :download:`Compiler/program.py <../Compiler/program.py>`.

.. code::

  ldmc c0, 8191 # 5
  gldmc cg0, 8191 # 6
  ldmint ci0, 8191 # 7
  ldms s0, 8191 # 8
  gldms sg0, 8191 # 9

These instructions read memory cells to registers, for example
:py:class:`~Compiler.instructions.ldms`. In this context, the purpose
is to indicate the memory usage. The addresses are all 8191 because
8192 is the default size for user memory given in
:file:`Compiler/config.py`. If you use
:py:class:`~Compiler.types.Array` or similar data-structures, these
numbers will increase accordingly.

.. code::

  active True # 10

:py:class:`~Compiler.instructions.active` indicates whether the
program is compatible with active security.

The compilation above also creates
:file:`Programs/Bytecode/journey-0.bc`, the hexdump output of which
looks as follows::

  00000000  00 00 00 00 00 00 00 02  00 00 00 00 00 00 00 7b  |...............{|
  00000010  00 00 00 00 00 00 00 a5  00 00 00 03 00 00 00 01  |................|
  00000020  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 b3  |................|
  00000030  00 00 00 00 00 00 00 00  00 00 00 b4 00 00 00 0a  |................|
  00000040  00 00 00 00 00 00 00 17  00 00 00 00 00 00 00 07  |................|
  00000050  00 00 00 00 00 00 00 01  00 00 00 00 00 00 00 03  |................|
  00000060  00 00 00 00 00 00 00 00  00 00 1f ff 00 00 00 00  |................|
  00000070  00 00 01 03 00 00 00 00  00 00 00 00 00 00 1f ff  |................|
  00000080  00 00 00 00 00 00 00 ca  00 00 00 00 00 00 00 00  |................|
  00000090  00 00 1f ff 00 00 00 00  00 00 00 04 00 00 00 00  |................|
  000000a0  00 00 00 00 00 00 1f ff  00 00 00 00 00 00 01 04  |................|
  000000b0  00 00 00 00 00 00 00 00  00 00 1f ff 00 00 00 00  |................|
  000000c0  00 00 00 e9 00 00 00 01                           |........|
  000000c8

It consist of the instructions codes and the arguments in big-endian
order. For example, 0x2 is the code for :py:obj:`lsdi`, 0xa5 is the
code for :py:obj:`asm_open`, 0xb3 is the code for
:py:obj:`print_reg_plain`, etc. You can also spot repeated occurrences
of ``1f ff``, which is the hexadecimal representation of 8191.

Finally, the compilation creates
:file:`Programs/Schedules/journey.sch`, which is a text file::

  1
  1
  journey-0:11
  1 0
  0
  ./compile.py journey
  lgp:0
  opts: 
  sec:40

The first two lines indicate the number of threads and bytecode files,
followed by the names of bytecode files (and the number of
instructions in each one). The fourth and fifth line are legacy, and
the sixth indicates the compilation command line. The remaining lines
indicate further options used during compilation.


Execution
---------

.. default-domain:: cpp

We will now walk through what happens when executing the program above
with Rep3 modulo :math:`2^{64}`. The main function in
:download:`Machines/replicated-ring-party.cpp
<../Machines/replicated-ring-party.cpp>` indirectly calls
:func:`Machine<sint, sgf2n>::run` in :download:`Processor/Machine.hpp
<../Processor/Machine.hpp>` with :class:`sint` being
``Rep3Share2<64>``. Then, the following happens:

1. :file:`Programs/Schedules/journey.sch` is parsed :func:`load_schedule`.
2. :file:`Programs/Bytecode/journey-0.bc` is parsed in
   :func:`Machine<sint, sgf2n>::load_program` where
   :func:`Program::parse`. This creates an internal representation of the
   code in :var:`Program::p` where an :class:`Instruction` object
   describes every instruction.
3. :func:`Machine<sint, sgf2n>::prepare` creates a computation thread
   using :func:`pthread_create`, which runs :func:`thread_info<sint,
   sgf2n>::Main_Func` in :download:`Processor/Online-Thread.hpp
   <../Processor/Online-Thread.hpp>`.
4. :func:`Machine<sint, sgf2n>::run` calls :func:`Machine<sint,
   sgf2n>::run_tape`, which signals the thread which code to run.
5. The computation thread waits for a signal in
   :func:`thread_info<sint, sgf2n>::Sub_Main_Func`. Once received, it
   calls :func:`Program::execute` in
   :download:`Processor/Instruction.hpp <../Processor/Instruction.hpp>`.
6. :func:`Program::execute` runs the main loop over the
   instructions. There is a switch statement acting on the instruction
   codes.
7. ``LDSI`` is defined in ``ARITHMETIC_INSTRUCTIONS`` in
   :download:`Processor/instructions.h
   <../Processor/instructions.h>`. It calls :func:`sint::constant`,
   which is defined in :download:`Protocols/Rep3Share.h
   <../Protocols/Rep3Share.h>` for ``Rep3Share2<64>``. This is in
   turn calls :func:`Replicated::assign` in
   :download:`Protocols/Replicated.h <../Protocols/Replicated.h>`,
   which creates a constant replicated secret sharing of 123, that is
   (123, 0) for party 0, (0, 123) for party 1, and (0, 0) for party 2.
8. ``OPEN`` is defined in another switch statement in
   :func:`Instruction::execute` in
   :download:`Processor/Instruction.hpp
   <../Processor/Instruction.hpp>`, where :func:`SubProcessor::POpen`
   in :download:`Processor/Processor.hpp <../Processor/Processor.hpp>`
   is called. This is turn uses the four-step interface of
   :class:`MAC_Check_Base` with an instance of
   :class:`ReplicatedMC`. The communication happens in
   :func:`ReplicatedMC::exchange`, and the reconstruction (summation)
   happens :func:`ReplicatedMC::finalize`, both in
   :download:`Protocols/ReplicatedMC.hpp
   <../Protocols/ReplicatedMC.hpp>`. The remaining functions mainly
   handle copying data and serialization.
9. ``PRINTREGPLAIN`` is also defined in the second switch statement,
   where :func:`Instruction::print` in
   :download:`Processor/Instruction.hpp
   <../Processor/Instruction.hpp>` is called. This function uses
   :class:`SwitchableOutput`, which is used to output to console, to
   file, or not at all depending on the settings.
10. ``PRINTCHR`` is defined in ``REGINT_INSTRUCTIONS`` in
    :download:`Processor/instructions.h
    <../Processor/instructions.h>`, which means that it's called via a
    switch statement in :func:`Instruction::execute_regint` in
    :download:`Processor/Instruction.cpp
    <../Processor/Instruction.cpp>`. It also uses
    :class:`SwitchableOutput`.
11. The remaining instructions are executed similarly but not do have
    a relevant effect.
12. When :func:`Program::execute` is done, control returns to
    :func:`thread_info<sint, sgf2n>::Sub_Main_Func`, which signals
    completion to the main thread.
13. After receiving the signal, :func:`Machine<sint, sgf2n>::run`
    completes and outputs the various statistics and exits

