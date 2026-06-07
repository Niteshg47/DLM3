/**
 * Convert a number to Indian Rupees in words
 * Example: 1234.56 -> "One Thousand Two Hundred Thirty Four Rupees and Fifty Six Paise"
 */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertHundreds(n: number): string {
    if (n < 20) return units[n];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      return tens[ten] + (unit ? " " + units[unit] : "");
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return (
      units[hundred] +
      " Hundred" +
      (remainder ? " and " + convertHundreds(remainder) : "")
    );
  }

  function convertLessThanLakh(n: number): string {
    if (n < 1000) return convertHundreds(n);
    const thousand = Math.floor(n / 1000);
    const remainder = n % 1000;
    return (
      convertHundreds(thousand) +
      " Thousand" +
      (remainder ? " " + convertHundreds(remainder) : "")
    );
  }

  function convertLessThanCrore(n: number): string {
    if (n < 100000) return convertLessThanLakh(n);
    const lakh = Math.floor(n / 100000);
    const remainder = n % 100000;
    return (
      convertLessThanLakh(lakh) +
      " Lakh" +
      (remainder ? " " + convertLessThanLakh(remainder) : "")
    );
  }

  function convert(n: number): string {
    if (n < 10000000) return convertLessThanCrore(n);
    const crore = Math.floor(n / 10000000);
    const remainder = n % 10000000;
    return (
      convertLessThanCrore(crore) +
      " Crore" +
      (remainder ? " " + convertLessThanCrore(remainder) : "")
    );
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = convert(rupees) + " Rupees";

  if (paise > 0) {
    result += " and " + convert(paise) + " Paise";
  }

  return result + " Only";
}
