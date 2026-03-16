const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email; // Return original if invalid

  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }

  const maskedLocal =
    local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
};

export default maskEmail;
