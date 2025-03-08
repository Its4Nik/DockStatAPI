import packageJson from "~/../package.json";

const version = packageJson.version;
const description = packageJson.description;
const authorName = packageJson.author.name;
const authorEmail = packageJson.author.email;
const authorWebsite = packageJson.author.url;
const license = packageJson.license;
const contributers = packageJson.contributors;
const dependencies = packageJson.dependencies;
const devDependencies = packageJson.devDependencies;

export {
  version,
  description,
  authorName,
  authorEmail,
  authorWebsite,
  license,
  contributers,
  dependencies,
  devDependencies,
};
