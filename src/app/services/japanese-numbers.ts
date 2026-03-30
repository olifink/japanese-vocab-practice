const KANJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function convertGroup(n: number): string {
  if (n === 0) return '';

  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;

  let result = '';
  if (thousands) result += (thousands === 1 ? '' : KANJI[thousands]) + '千';
  if (hundreds) result += (hundreds === 1 ? '' : KANJI[hundreds]) + '百';
  if (tens) result += (tens === 1 ? '' : KANJI[tens]) + '十';
  if (ones) result += KANJI[ones];
  return result;
}

/** Converts an Arabic number string (e.g. "778.543") to Japanese kanji numerals. */
export function toJapaneseNumeral(numStr: string): string {
  if (!numStr || numStr === '-' || numStr === '.' || numStr.endsWith('.')) return '';

  const isNegative = numStr.startsWith('-');
  const absStr = isNegative ? numStr.slice(1) : numStr;

  const dotIndex = absStr.indexOf('.');
  const intPartStr = dotIndex >= 0 ? absStr.slice(0, dotIndex) : absStr;
  const decimalPartStr = dotIndex >= 0 ? absStr.slice(dotIndex + 1) : undefined;

  if (intPartStr === '') return '';
  const intPart = parseInt(intPartStr, 10);
  if (Number.isNaN(intPart)) return '';

  let result = isNegative ? 'マイナス' : '';

  if (intPart === 0) {
    result += 'ゼロ';
  } else {
    const oku = Math.floor(intPart / 100_000_000);
    const man = Math.floor((intPart % 100_000_000) / 10_000);
    const rest = intPart % 10_000;

    if (oku) result += convertGroup(oku) + '億';
    if (man) result += convertGroup(man) + '万';
    if (rest || (!oku && !man)) result += convertGroup(rest);
  }

  if (decimalPartStr !== undefined && decimalPartStr !== '') {
    result += '点';
    for (const digit of decimalPartStr) {
      result += KANJI[parseInt(digit)];
    }
  }

  return result;
}

/** Generates a random number for listening practice, covering a varied range. */
export function generateRandomNumber(): string {
  const type = Math.floor(Math.random() * 5);
  switch (type) {
    case 0:
      return String(Math.floor(Math.random() * 99) + 1);
    case 1:
      return String(Math.floor(Math.random() * 900) + 100);
    case 2:
      return String(Math.floor(Math.random() * 9000) + 1000);
    case 3:
      return String(Math.floor(Math.random() * 90000) + 10000);
    case 4: {
      const base = Math.floor(Math.random() * 1000);
      const decimals = Math.floor(Math.random() * 3) + 1;
      let dec = '';
      for (let i = 0; i < decimals; i++) {
        dec += Math.floor(Math.random() * 10);
      }
      return `${base}.${dec}`;
    }
    default:
      return String(Math.floor(Math.random() * 100));
  }
}
