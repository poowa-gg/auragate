import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { decodeCp037, encodeCp037, decodeComp3, encodeComp3 } from '../../src/core/ebcdic.js';

test('EBCDIC CP037 Property Tests', async (t) => {
  await t.test('Round-trip alphanumeric invariance', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (text) => {
        // Only test ASCII printable characters supported by CP037 base alphabet
        const cleanText = text.replace(/[^\x20-\x7E]/g, ' ');
        const encoded = encodeCp037(cleanText);
        const decoded = decodeCp037(encoded);

        assert.equal(decoded.success, true);
        if (decoded.success) {
          assert.equal(decoded.value, cleanText);
        }
      }),
      { numRuns: 1000 }
    );
  });

  await t.test('Fuzz stability: arbitrary byte streams never throw uncaught errors', () => {
    fc.assert(
      fc.property(fc.uint8Array({ minLength: 0, maxLength: 512 }), (bytes) => {
        const buf = Buffer.from(bytes);
        const result = decodeCp037(buf);
        assert.equal(result.success, true); // CP037 map translates every byte 0x00-0xFF
      }),
      { numRuns: 1000 }
    );
  });
});

test('COMP-3 Packed Decimal Property Tests', async (t) => {
  await t.test('Round-trip signed integer fidelity', () => {
    fc.assert(
      fc.property(fc.integer({ min: -9999999, max: 9999999 }), (val) => {
        const packed = encodeComp3(val, 4, 0); // 4 bytes = 7 digits + 1 sign nibble
        const unpacked = decodeComp3(packed, 0);

        assert.equal(unpacked.success, true);
        if (unpacked.success) {
          assert.equal(unpacked.value, val);
        }
      }),
      { numRuns: 1000 }
    );
  });

  await t.test('Fuzz rejection: random byte streams return ParseError gracefully', () => {
    fc.assert(
      fc.property(fc.uint8Array({ minLength: 1, maxLength: 16 }), (bytes) => {
        const buf = Buffer.from(bytes);
        const result = decodeComp3(buf);
        // Must either succeed (valid BCD) or return a structured error, never crash
        assert.ok('success' in result);
      }),
      { numRuns: 1000 }
    );
  });
});
