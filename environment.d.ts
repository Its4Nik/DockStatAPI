declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Node specific:
      NODE_ENV: "development" | "production" | "testing";
      PORT: string | undefined;
    }
  }
}

export {};
