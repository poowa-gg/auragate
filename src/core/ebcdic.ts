/**
 * AuraGate Core Codec: IBM CP037 EBCDIC & COBOL COMP-3 (Packed Decimal)
 */

export type Result<T, E = ParseError> =
  | { success: true; value: T }
  | { success: false; error: E };

export interface ParseError {
  code: 'INVALID_NIBBLE' | 'INVALID_SIGN' | 'EMPTY_BUFFER' | 'BUFFER_OVERFLOW';
  message: string;
  offset?: number;
}

// CP037 to UTF-8 Byte Mapping Table (0x00 - 0xFF)
const CP037_TO_ASCII: number[] = [
  0x00, 0x01, 0x02, 0x03, 0x9c, 0x09, 0x86, 0x7f, 0x97, 0x8d, 0x8e, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
  0x10, 0x11, 0x12, 0x13, 0x9d, 0x85, 0x08, 0x87, 0x18, 0x19, 0x92, 0x8f, 0x1c, 0x1d, 0x1e, 0x1f,
  0x80, 0x81, 0x82, 0x83, 0x84, 0x0a, 0x17, 0x1b, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x05, 0x06, 0x07,
  0x90, 0x91, 0x16, 0x93, 0x94, 0x95, 0x96, 0x04, 0x98, 0x99, 0x9a, 0x9b, 0x14, 0x15, 0x9e, 0x1a,
  0x20, 0xa0, 0xe2, 0xe4, 0xe0, 0xe1, 0xe3, 0xe5, 0xe7, 0xf1, 0xa2, 0x2e, 0x3c, 0x28, 0x2b, 0x7c,
  0x26, 0xe9, 0xea, 0xeb, 0xe8, 0xed, 0xee, 0xef, 0xec, 0xdf, 0x21, 0x24, 0x2a, 0x29, 0x3b, 0xac,
  0x2d, 0x2f, 0xc2, 0xc4, 0xc0, 0xc1, 0xc3, 0xc5, 0xc7, 0xd1, 0xa6, 0x2c, 0x25, 0x5f, 0x3e, 0x3f,
  0xf8, 0xc9, 0xca, 0xcb, 0xc8, 0xcd, 0xce, 0xcf, 0xcc, 0x60, 0x3a, 0x23, 0x40, 0x27, 0x3d, 0x22,
  0xd8, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0xab, 0xbb, 0xf0, 0xfd, 0xfe, 0xb1,
  0xb0, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0xaa, 0xba, 0xe6, 0xb8, 0xc6, 0xa4,
  0xb5, 0x7e, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0xa1, 0xbf, 0xd0, 0xdd, 0xde, 0xae,
  0x5e, 0xa3, 0xa5, 0xb7, 0xa9, 0xa7, 0xb6, 0xbc, 0xbd, 0xbe, 0x5b, 0x5d, 0xaf, 0xa8, 0xb4, 0xd7,
  0x7b, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0xad, 0xf4, 0xf6, 0xf2, 0xf3, 0xf5,
  0x7d, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0xb9, 0xfb, 0xfc, 0xf9, 0xfa, 0xff,
  0x5c, 0xf7, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0xb2, 0xd4, 0xd6, 0xd2, 0xd3, 0xd5,
  0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0xb3, 0xdb, 0xdc, 0xd9, 0xda, 0x9f
];

// Inverted lookup map for encoding ASCII -> CP037
const ASCII_TO_CP037 = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  ASCII_TO_CP037[CP037_TO_ASCII[i]] = i;
}

/**
 * Decodes a raw CP037 EBCDIC byte buffer into a UTF-8 string.
 */
export function decodeCp037(buffer: Buffer): Result<string> {
  if (buffer.length === 0) {
    return { success: true, value: '' };
  }
  const out = Buffer.allocUnsafe(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    out[i] = CP037_TO_ASCII[buffer[i]];
  }
  return { success: true, value: out.toString('utf-8') };
}

/**
 * Encodes a UTF-8 string into a CP037 EBCDIC byte buffer.
 */
export function encodeCp037(text: string): Buffer {
  const asciiBuf = Buffer.from(text, 'utf-8');
  const ebcdicBuf = Buffer.allocUnsafe(asciiBuf.length);
  for (let i = 0; i < asciiBuf.length; i++) {
    ebcdicBuf[i] = ASCII_TO_CP037[asciiBuf[i]] || 0x40; // Default to space (0x40) if unmapped
  }
  return ebcdicBuf;
}

/**
 * Decodes COBOL COMP-3 (packed decimal) buffer into a signed number.
 * Each byte contains two 4-bit nibbles (BCD digits).
 * The final low nibble is the sign: 0xC/0xF = positive, 0xD/0xB = negative.
 * 
 * @param buffer Raw packed-decimal buffer
 * @param decimals Number of implied decimal places (scale)
 */
export function decodeComp3(buffer: Buffer, decimals: number = 0): Result<number> {
  if (buffer.length === 0) {
    return { success: false, error: { code: 'EMPTY_BUFFER', message: 'COMP-3 buffer cannot be empty' } };
  }

  let digits = '';
  const lastIndex = buffer.length - 1;

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    const high = (byte >> 4) & 0x0f;
    const low = byte & 0x0f;

    if (i === lastIndex) {
      if (high > 9) {
        return {
          success: false,
          error: { code: 'INVALID_NIBBLE', message: `High nibble at byte ${i} must be a digit 0-9`, offset: i }
        };
      }
      digits += high.toString();

      // Sign validation on final low nibble
      let signMultiplier = 1;
      if (low === 0x0d || low === 0x0b) {
        signMultiplier = -1;
      } else if (low === 0x0c || low === 0x0f) {
        signMultiplier = 1;
      } else {
        return {
          success: false,
          error: { code: 'INVALID_SIGN', message: `Invalid COMP-3 sign nibble: 0x${low.toString(16)}`, offset: i }
        };
      }

      let parsed = Number(digits);
      if (decimals > 0) {
        parsed = parsed / Math.pow(10, decimals);
      }
      return { success: true, value: parsed * signMultiplier };
    } else {
      if (high > 9 || low > 9) {
        return {
          success: false,
          error: { code: 'INVALID_NIBBLE', message: `Invalid decimal nibble at byte ${i}`, offset: i }
        };
      }
      digits += high.toString() + low.toString();
    }
  }

  return { success: false, error: { code: 'BUFFER_OVERFLOW', message: 'Failed to terminate packed-decimal parse' } };
}

/**
 * Encodes a numeric value into a COBOL COMP-3 packed decimal buffer.
 * 
 * @param value Number to pack
 * @param byteLength Target buffer length
 * @param decimals Implied decimal places
 */
export function encodeComp3(value: number, byteLength: number, decimals: number = 0): Buffer {
  const isNegative = value < 0;
  const absInt = Math.round(Math.abs(value) * Math.pow(10, decimals));
  const signNibble = isNegative ? 0x0d : 0x0c;

  const totalNibbles = byteLength * 2;
  const numDigits = totalNibbles - 1;
  const strVal = absInt.toString().padStart(numDigits, '0');

  const buf = Buffer.alloc(byteLength);
  let strIdx = 0;

  for (let i = 0; i < byteLength; i++) {
    if (i === byteLength - 1) {
      const high = parseInt(strVal[strIdx] || '0', 10);
      buf[i] = (high << 4) | signNibble;
    } else {
      const high = parseInt(strVal[strIdx++] || '0', 10);
      const low = parseInt(strVal[strIdx++] || '0', 10);
      buf[i] = (high << 4) | low;
    }
  }

  return buf;
}
