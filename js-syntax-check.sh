#!/bin/sh

find . -name '*.js' -not -path '*/dist/*' -exec './tools/jscheck' '{}' '+'
