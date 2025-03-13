#!/bin/bash

mermaidContent="$(cat dependency-graph.mmd)"

echo "
---
config:
    flowchart:
        defaultRenderer: elk
---

$mermaidContent
" > dependency-graph.mmd

