#!/bin/bash
TMP=$(mktemp)
IGNORE="node_modules|logger|.dependency-cruiser|path|fs|os|https|net|process|util"

cat ./src/init.ts | grep "./routes" | awk '{print $2,$4}' > $TMP

spawn_worker(){
    local line="$1"
    local target_route="$(echo "$line" | cut -d '"' -f2 | sed 's|^./routes|./src/routes|').ts"
    local route=$(echo "$line" | awk '{print $1}')

    echo -e "\nRoute: $route \n${target_route}"

    test=true depcruise \
        -c ./src/misc/dependencyGraphs/.dependency-cruiser.cjs \
        -p cli-feedback \
        -T mermaid \
        -x "$IGNORE" \
        -f ./src/misc/dependencyGraphs/mermaid-${route}.txt \
        ${target_route} || exit 1
}

while read line; do
    spawn_worker "$line" &
done < <(cat $TMP)

npx depcruise \
    -c ./src/misc/dependencyGraphs/.dependency-cruiser.cjs \
    -p cli-feedback \
    -T mermaid \
    -x "$IGNORE" \
    -f ./src/misc/dependencyGraphs/mermaid-all.txt \
    ./src/server.ts || exit 1

wait

find ./src/misc/dependencyGraphs -type f -name "*.txt" -exec sed -i 's/flowchart LR/flowchart TB/g' {} +

echo -e "\n========\n\n  DONE\n\n========"

exit 0
