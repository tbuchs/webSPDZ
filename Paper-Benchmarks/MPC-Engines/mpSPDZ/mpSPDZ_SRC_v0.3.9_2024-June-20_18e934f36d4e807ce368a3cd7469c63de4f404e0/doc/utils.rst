Bytecode Utilities
==================


Memory usage
------------

``Scripts/memory-usage.py <program-with-args>`` gives you an estimate
of the minimum RAM usage per party. The range is relatively large due
to fact the bytecode is independent of the secret sharing.


Human-readable bytecode/circuit representation
----------------------------------------------

``Scripts/decompile.py <program-with-args>`` produces human-readable
version of the bytecode in ``Programs/Bytecode``. The filename format
is ``Programs/Bytecode/<program-with-args>-<tapeid>.asm``. For
example, after compiling and decompiling the tutorial, you will find
``Programs/Bytecode/tutorial-0.asm``. You can find the full list of
tape names in the third line of ``Programs/Schedule/tutorial.sch``.
See :ref:`this section <instructions>` for an explanation of
instruction names.
