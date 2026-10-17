/**
 * Centralized access to environment variables.
 * Read lazily so `next build` works even without credentials.
 */
export const env = {
  get metaAppSecret() {
    return process.env.META_APP_SECRET ?? "";
  },
  get igVerifyToken() {
    return process.env.IG_VERIFY_TOKEN ?? "";
  },
  get igAccessToken() {
    return process.env.IG_ACCESS_TOKEN ?? "";
  },
  get igUserId() {
    return process.env.IG_USER_ID ?? "";
  },
  get graphVersion() {
    return process.env.GRAPH_API_VERSION ?? "v21.0";
  },
};
