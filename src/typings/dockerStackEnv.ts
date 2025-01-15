interface dockerStackProperty {
  name: string;
  value: string;
}

interface dockerStackEnv {
  environment: dockerStackProperty[];
}

export { dockerStackEnv, dockerStackProperty };
