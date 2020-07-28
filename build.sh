#!/bin/bash

tsc
mkdir -p dist/
cp -rav lib/* dist/
cp -rav src/* dist/