const fs = require('fs');
const path = require('path');

const dependencies = JSON.parse(fs.readFileSync('dependencies.json', 'utf-8'));

const edges = [];
Object.entries(dependencies).forEach(([file, deps]) => {
  deps.forEach(dep => {
    edges.push(`  "${file}" --> "${dep}"`);
  });
});

const mermaidContent = `graph TD
${edges.join('\n')}`;

const markdownDoc = `# DockStatAPI Dependency Graph

\`\`\`mermaid
${mermaidContent}
\`\`\`
`;

fs.writeFileSync(path.join("./", 'dependencies.md'), markdownDoc);

console.log('Successfully generated dependency graph');