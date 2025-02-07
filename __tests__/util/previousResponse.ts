let response: string = "";

class PreviousResponse {
  set(body: unknown): void {
    try {
      response = JSON.stringify(body).replace(/[" ]/g, "");
    } catch (error: unknown) {
      console.error("Error in setting response:", error);
      throw new Error("Failed to set response");
    }
  }

  get(): string {
    try {
      return response;
    } catch (error: unknown) {
      console.error("Error in getting response:", error);
      throw new Error("Failed to get response");
    }
  }
}

export const createPreviousResponse = () => new PreviousResponse();
