import packageJson from "~/../package.json";
const { version, description, license, contributors, dependencies, devDependencies } = packageJson;

const authorName = packageJson.author.name;
const authorEmail = packageJson.author.email;
const authorWebsite = packageJson.author.url;

export {
  version,
  description,
  authorName,
  authorEmail,
  authorWebsite,
  license,
  contributors,
  dependencies,
  devDependencies,
};
