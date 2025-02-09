#!/bin/bash

dist="$(pwd)/dist"

run_script() {
    npx uglifyjs --no-annotations --in-situ "$1" > /dev/null
    echo "✔️ Minified : $(basename "$1")"
}

if [ -d "$dist" ]; then
    echo "::: Dist directory exists."
else
    echo "::: Dist does not exist... Running npx tsc"
    npx tsc
fi

max_jobs=$(nproc)
job_count=0

for file in $(find "$dist" -type f -name "*.js"); do
    run_script "$file" &
    ((job_count++))

    if ((job_count >= max_jobs)); then
        wait
        job_count=0
    fi
done

wait

echo

if [[ $1 == "--build-only" ]]; then
    exit 0
fi

node dist/server.js
