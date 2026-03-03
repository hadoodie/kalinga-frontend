#!/bin/bash
set -e

# OSRM_DATA_URL must be set in the environment
if [ -z "$OSRM_DATA_URL" ]; then
    echo "ERROR: OSRM_DATA_URL environment variable is not set."
    exit 1
fi

echo "--- Downloading OSRM data from $OSRM_DATA_URL ---"
# Create /data directory if it doesn't exist and download/extract
mkdir -p /data
curl -sSL "$OSRM_DATA_URL" | tar -xzf - -C /data

echo "--- Download and Extraction Complete. Starting osrm-routed. ---"
# Use the *unzipped* OSRM base file name here
# (e.g., if you tarballed philippines-251128.osrm, use that name below)
/usr/local/bin/osrm-routed /data/philippines-251128.osrm