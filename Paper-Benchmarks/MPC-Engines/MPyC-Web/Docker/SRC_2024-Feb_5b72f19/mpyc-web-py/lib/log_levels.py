"""
This module defines logging functionality for the mpyc-web project.

It defines a custom logging handler that uses the rich library to format log messages with emojis and colors.
It also defines a function to set the log level and a custom function to print a directory tree.
"""

import logging

CRITICAL = logging.CRITICAL
FATAL = logging.FATAL
ERROR = logging.ERROR
WARNING = logging.WARNING
WARN = logging.WARN
NOTSET = logging.NOTSET
INFO = logging.INFO
DEBUG = logging.DEBUG
TRACE = 5
