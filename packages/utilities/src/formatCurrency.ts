type FormatCurrencyOptions = {
  prefix: "none" | "symbol" | "text";
};

const formatCurrency = (
  value: number | string,
  options: FormatCurrencyOptions = {
    prefix: "symbol",
  },
) =>
  Intl.NumberFormat("en-PH", {
    style: options?.prefix !== "none" ? "currency" : undefined,
    currency: "PHP",
    minimumFractionDigits: 2,
    currencyDisplay:
      options?.prefix === "symbol"
        ? "narrowSymbol"
        : options?.prefix === "text"
          ? "code"
          : undefined,
  }).format(parseFloat(`${value}`.replace(",", "")));

export default formatCurrency;
