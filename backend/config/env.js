// Centralized, validated environment configuration.
// Import this instead of reading process.env directly for critical settings,
// so a misconfigured deployment fails fast at startup rather than silently
// falling back to insecure defaults.

const requireEnv = (name) => {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in your .env file or deployment configuration.`
    );
  }

  return value;
};

// JWT_SECRET must always be provided. There is intentionally no default:
// a hardcoded fallback would let anyone forge valid tokens if the variable
// were ever unset in production.
export const JWT_SECRET = requireEnv("JWT_SECRET");

export default {
  JWT_SECRET,
};
