const unitsMap = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  
  const tensMap = [
    "Zero", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];
  
  const numberToWords = (number) => {
    if (number === 0) return "";
  
    if (number < 0) return "minus " + numberToWords(Math.abs(number));
  
    let words = "";
  
    if (Math.floor(number / 10000000) > 0) {
      words += numberToWords(Math.floor(number / 10000000)) + " crore ";
      number %= 10000000;
    }
  
    if (Math.floor(number / 100000) > 0) {
      words += numberToWords(Math.floor(number / 100000)) + " lakh ";
      number %= 100000;
    }
  
    if (Math.floor(number / 1000) > 0) {
      words += numberToWords(Math.floor(number / 1000)) + " thousand ";
      number %= 1000;
    }
  
    if (Math.floor(number / 100) > 0) {
      words += numberToWords(Math.floor(number / 100)) + " hundred ";
      number %= 100;
    }
  
    if (number > 0) {
      if (words !== "") words += "and ";
  
      if (number < 20) {
        words += unitsMap[number];
      } else {
        words += tensMap[Math.floor(number / 10)];
        if ((number % 10) > 0) {
          words += "-" + unitsMap[number % 10];
        }
      }
    }
  
    return words.trim();
  };
  
  export const convertToWords = (amount) => {
    if (amount === 0) return "Zero rupees";
  
    const intPart = Math.floor(amount);
    const decimalPart = Math.round((amount - intPart) * 100);
  
    let words = numberToWords(intPart).trim();
    if (words === "") words = "Zero";
  
    let result = words + " rupees";
  
    if (decimalPart > 0) {
      result += " and " + numberToWords(decimalPart).trim() + " paise";
    }
  
    return result.trim();
  };
  