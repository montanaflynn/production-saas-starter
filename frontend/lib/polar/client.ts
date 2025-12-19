import { Polar } from "@polar-sh/sdk";

let cachedClient: Polar | null = null;

function createPolarClient(): Polar | null {
  if (typeof window !== "undefined") {
    throw new Error("Polar SDK client must only be instantiated on the server.");
  }

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Polar] POLAR_ACCESS_TOKEN is not configured; billing features are disabled.");
    }
    return null;
  }

  const server = process.env.NODE_ENV === "production" ? "production" : "sandbox";
  console.info("[Polar] Initializing Polar client", { server });

  return new Polar({
    accessToken,
    server,
  });
}

export function getPolarClient(): Polar | null {
  if (cachedClient) {
    console.debug("[Polar] Reusing cached Polar client");
    return cachedClient;
  }

  const client = createPolarClient();
  if (!client) {
    console.warn("[Polar] Polar client unavailable");
    return null;
  }

  cachedClient = client;
  return cachedClient;
}
