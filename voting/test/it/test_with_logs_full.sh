#!/usr/bin/env bash

setLogFilename() {
    local number=0
    local folder=$1
    local prefix="$folder/full_test_output_"

    local today="$( date +"%Y%m%d" )"
    local suffix="$( printf -- '-%02d' "$number" )"
    while [[ -f "$prefix$today$suffix.log" ]]
    do
        (( ++number ))
        suffix="$( printf -- '-%02d' "$number" )"
    done

    log_filename="logs/full_test_output_$today$suffix.log"
}

logs_dir="logs"
setLogFilename $logs_dir
mkdir -p $logs_dir
printf 'log file: %s\n' "$log_filename"

time ./test_full.sh $@ 2>&1 | tee $log_filename

