const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export const getRazorpayTestCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay Test Mode keys are not configured.");
  }

  if (!keyId.startsWith("rzp_test_")) {
    throw new Error(
      "Only Razorpay Test Mode keys are allowed in this portfolio project.",
    );
  }

  return { keyId, keySecret };
};

const authorizationHeader = (keyId, keySecret) =>
  `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

export const razorpayRequest = async (path, options = {}) => {
  const { keyId, keySecret } = getRazorpayTestCredentials();
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: authorizationHeader(keyId, keySecret),
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const description =
      data?.error?.description ||
      data?.error?.reason ||
      `Razorpay returned HTTP ${response.status}.`;

    throw new Error(description);
  }

  return data;
};
