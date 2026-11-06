/**
 * AuraGate Core Codec: ISO-8583 Financial Switch Bitmap Unpacker
 */

export type Result<T, E = IsoUnpackError> =
  | { success: true; value: T }
  | { success: false; error: E };

export interface IsoUnpackError {
  code: 'TRUNCATED_BITMAP' | 'INVALID_FIELD_LENGTH' | 'BUFFER_UNDERFLOW' | 'INVALID_FIELD_DEFINITION';
  message: string;
  fieldNumber?: number;
  offset?: number;
}

export type FieldLengthType = 'FIXED' | 'LLVAR' | 'LLLVAR';

export interface FieldDefinition {
  name: string;
  type: FieldLengthType;
  length: number; // Max length for variable, fixed length for FIXED
}

// Core ISO-8583 standard field dictionary subset
export const STANDARD_ISO_FIELDS: Record<number, FieldDefinition> = {
  2: { name: 'pan', type: 'LLVAR', length: 19 },
  3: { name: 'processingCode', type: 'FIXED', length: 6 },
  4: { name: 'amount', type: 'FIXED', length: 12 },
  7: { name: 'transmissionDateTime', type: 'FIXED', length: 10 },
  11: { name: 'stan', type: 'FIXED', length: 6 },
  12: { name: 'localTime', type: 'FIXED', length: 6 },
  13: { name: 'localDate', type: 'FIXED', length: 4 },
  37: { name: 'retrievalReferenceNumber', type: 'FIXED', length: 12 },
  39: { name: 'responseCode', type: 'FIXED', length: 2 },
  41: { name: 'terminalId', type: 'FIXED', length: 8 },
  42: { name: 'merchantId', type: 'FIXED', length: 15 },
  48: { name: 'privateAdditionalData', type: 'LLLVAR', length: 999 },
  49: { name: 'currencyCode', type: 'FIXED', length: 3 },
  70: { name: 'networkManagementCode', type: 'FIXED', length: 3 }
};

export interface IsoMessage {
  mti: string;
  fields: Record<number, string>;
  presentFields: number[];
}

/**
 * Extracts list of active field indices from an ISO-8583 binary bitmap buffer.
 */
export function parseBitmap(buffer: Buffer, offset: number = 0): { fields: number[]; bytesConsumed: number } {
  if (buffer.length - offset < 8) {
    return { fields: [], bytesConsumed: 0 };
  }

  const hasSecondary = (buffer[offset] & 0x80) !== 0;
  const bitmapLength = hasSecondary ? 16 : 8;

  if (buffer.length - offset < bitmapLength) {
    return { fields: [], bytesConsumed: 0 };
  }

  const fields: number[] = [];
  for (let byteIdx = 0; byteIdx < bitmapLength; byteIdx++) {
    const currentByte = buffer[offset + byteIdx];
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      const bitPosition = byteIdx * 8 + bitIdx + 1;
      if (bitPosition === 1) continue; // Bit 1 indicates presence of secondary bitmap

      const mask = 1 << (7 - bitIdx);
      if ((currentByte & mask) !== 0) {
        fields.push(bitPosition);
      }
    }
  }

  return { fields, bytesConsumed: bitmapLength };
}

/**
 * Unpacks an ISO-8583 binary packet into a structured IsoMessage.
 */
export function unpackIso8583(
  buffer: Buffer,
  fieldDefinitions: Record<number, FieldDefinition> = STANDARD_ISO_FIELDS
): Result<IsoMessage> {
  // Need at least 4 bytes MTI + 8 bytes Primary Bitmap
  if (buffer.length < 12) {
    return {
      success: false,
      error: { code: 'BUFFER_UNDERFLOW', message: 'Buffer too small for ISO-8583 header and bitmap', offset: 0 }
    };
  }

  let cursor = 0;
  const mti = buffer.subarray(0, 4).toString('utf-8');
  cursor += 4;

  const { fields: presentFields, bytesConsumed: bitmapBytes } = parseBitmap(buffer, cursor);
  if (bitmapBytes === 0) {
    return {
      success: false,
      error: { code: 'TRUNCATED_BITMAP', message: 'Buffer underflow while reading bitmap', offset: cursor }
    };
  }
  cursor += bitmapBytes;

  const fields: Record<number, string> = {};

  for (const fieldNum of presentFields) {
    const def = fieldDefinitions[fieldNum];
    if (!def) {
      // Unknown field: return structured error rather than crashing
      return {
        success: false,
        error: {
          code: 'INVALID_FIELD_DEFINITION',
          message: `Unknown definition for field ${fieldNum}`,
          fieldNumber: fieldNum,
          offset: cursor
        }
      };
    }

    let fieldLength = 0;

    if (def.type === 'FIXED') {
      fieldLength = def.length;
    } else if (def.type === 'LLVAR') {
      if (cursor + 2 > buffer.length) {
        return {
          success: false,
          error: { code: 'BUFFER_UNDERFLOW', message: `Truncated LLVAR header on field ${fieldNum}`, fieldNumber: fieldNum, offset: cursor }
        };
      }
      fieldLength = parseInt(buffer.subarray(cursor, cursor + 2).toString('utf-8'), 10);
      cursor += 2;
    } else if (def.type === 'LLLVAR') {
      if (cursor + 3 > buffer.length) {
        return {
          success: false,
          error: { code: 'BUFFER_UNDERFLOW', message: `Truncated LLLVAR header on field ${fieldNum}`, fieldNumber: fieldNum, offset: cursor }
        };
      }
      fieldLength = parseInt(buffer.subarray(cursor, cursor + 3).toString('utf-8'), 10);
      cursor += 3;
    }

    if (isNaN(fieldLength) || fieldLength < 0 || fieldLength > def.length) {
      return {
        success: false,
        error: {
          code: 'INVALID_FIELD_LENGTH',
          message: `Invalid parsed length ${fieldLength} for field ${fieldNum}`,
          fieldNumber: fieldNum,
          offset: cursor
        }
      };
    }

    if (cursor + fieldLength > buffer.length) {
      return {
        success: false,
        error: {
          code: 'BUFFER_UNDERFLOW',
          message: `Buffer ended prematurely while reading field ${fieldNum}`,
          fieldNumber: fieldNum,
          offset: cursor
        }
      };
    }

    fields[fieldNum] = buffer.subarray(cursor, cursor + fieldLength).toString('utf-8');
    cursor += fieldLength;
  }

  return {
    success: true,
    value: {
      mti,
      fields,
      presentFields
    }
  };
}

/**
 * Packs an ISO-8583 message back into a Buffer for round-trip testing.
 */
export function packIso8583(
  mti: string,
  fields: Record<number, string>,
  fieldDefinitions: Record<number, FieldDefinition> = STANDARD_ISO_FIELDS
): Buffer {
  const presentNums = Object.keys(fields).map(Number).sort((a, b) => a - b);
  const maxField = presentNums.length > 0 ? presentNums[presentNums.length - 1] : 0;
  const hasSecondary = maxField > 64;
  const bitmapLength = hasSecondary ? 16 : 8;

  const bitmapBuf = Buffer.alloc(bitmapLength);
  if (hasSecondary) {
    bitmapBuf[0] |= 0x80; // Turn on bit 1 for secondary bitmap
  }

  for (const num of presentNums) {
    const bitPos = num - 1;
    const byteIdx = Math.floor(bitPos / 8);
    const bitIdx = bitPos % 8;
    bitmapBuf[byteIdx] |= (1 << (7 - bitIdx));
  }

  const parts: Buffer[] = [Buffer.from(mti, 'utf-8'), bitmapBuf];

  for (const num of presentNums) {
    const val = fields[num] ?? '';
    const def = fieldDefinitions[num];

    if (def?.type === 'LLVAR') {
      parts.push(Buffer.from(val.length.toString().padStart(2, '0'), 'utf-8'));
    } else if (def?.type === 'LLLVAR') {
      parts.push(Buffer.from(val.length.toString().padStart(3, '0'), 'utf-8'));
    }
    parts.push(Buffer.from(val, 'utf-8'));
  }

  return Buffer.concat(parts);
}
