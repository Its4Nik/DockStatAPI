type TypeCheck = [any, string];

export function typeCheck(value: any, expectedType: string): boolean {
  if (expectedType === "null") {
    return value === null;
  }

  if (expectedType === "array") {
    return Array.isArray(value);
  }

  const actualType = typeof value;

  if (actualType === "object" && value !== null) {
    if (expectedType === "object") {
      return !Array.isArray(value);
    }
    return false;
  }

  return actualType === expectedType;
}

export function validateTypes(checks: TypeCheck[]): boolean[] {
  return checks.map(([value, expectedType]) => {
    return typeCheck(value, expectedType.toLowerCase());
  });
}
