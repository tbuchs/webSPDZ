#!/usr/bin/env python3

import os, sys

sys.path.insert(0, os.path.dirname(sys.argv[0]) + '/..')

from Compiler.compilerLib import Compiler

compiler = Compiler(
    execute=True, split_args=True,
    usage="usage: %prog [options] [-E] protocol filename [args] "
    "[-- [run-time args]]")
compiler.prep_compile()
prog = compiler.compile_file()

if prog.options.hostfile:
    compiler.remote_execution()
else:
    compiler.local_execution()
