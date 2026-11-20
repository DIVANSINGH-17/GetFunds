export const validateContributionInput = (input) => {
  const username = String(input?.username || "").trim().toLowerCase();
  const name = String(input?.name || "").trim();
  const message = String(input?.message || "").trim();
  const amount = Number(input?.amount);

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return { ok: false, error: "Invalid creator username." };
  }

  if (name.length < 2 || name.length > 60) {
    return {
      ok: false,
      error: "Supporter name must contain between 2 and 60 characters.",
    };
  }

  if (message.length > 240) {
    return {
      ok: false,
      error: "Message must contain at most 240 characters.",
    };
  }

  if (!Number.isInteger(amount) || amount < 10 || amount > 100000) {
    return {
      ok: false,
      error: "Test amount must be a whole number between ₹10 and ₹1,00,000.",
    };
  }

  return {
    ok: true,
    value: { username, name, message, amount },
  };
};
