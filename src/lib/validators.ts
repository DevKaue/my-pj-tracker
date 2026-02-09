const onlyDigits = (value: string) => value.replace(/\D/g, '');

const isRepeatedDigit = (value: string) => /^(\d)\1+$/.test(value);

function calculateCheckDigit(digits: string, multipliers: number[]) {
  const sum = digits
    .split('')
    .reduce((acc, digit, index) => acc + Number(digit) * multipliers[index], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function normalizeDocument(value: string) {
  return onlyDigits(value);
}

export function isValidCPF(value: string) {
  const digits = normalizeDocument(value);
  if (digits.length !== 11 || isRepeatedDigit(digits)) return false;

  const base = digits.slice(0, 9);
  const firstCheck = calculateCheckDigit(
    base,
    [10, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const secondCheck = calculateCheckDigit(
    `${base}${firstCheck}`,
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return `${firstCheck}${secondCheck}` === digits.slice(9);
}

export function isValidCNPJ(value: string) {
  const digits = normalizeDocument(value);
  if (digits.length !== 14 || isRepeatedDigit(digits)) return false;

  const base = digits.slice(0, 12);
  const firstMultipliers = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondMultipliers = [6, ...firstMultipliers];

  const firstCheck = calculateCheckDigit(base, firstMultipliers);
  const secondCheck = calculateCheckDigit(`${base}${firstCheck}`, secondMultipliers);

  return `${firstCheck}${secondCheck}` === digits.slice(12);
}

export function isDocumentIdentifier(value: string) {
  return isValidCPF(value) || isValidCNPJ(value);
}

export function isValidEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(normalized);
}

export function formatDocument(value: string) {
  const digits = normalizeDocument(value);
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return digits;
}
