import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { unpackIso8583, packIso8583, parseBitmap } from '../../src/core/iso8583.js';

test('ISO-8583 Bitmap Parsing Invariants', async (t) => {
  await t.test('Bitmap bit extraction round-trip', () => {
    // Generate random subset of valid fields between 2 and 64
    const validFieldArb = fc.subarray([2, 3, 4, 7, 11, 12, 13, 37, 39, 41, 42, 49]);

    fc.assert(
      fc.property(validFieldArb, (fieldList) => {
        const sortedFields = [...new Set(fieldList)].sort((a, b) => a - b);
        const bitmapBuf = Buffer.alloc(8);

        for (const num of sortedFields) {
          const bitPos = num - 1;
          const byteIdx = Math.floor(bitPos / 8);
          const bitIdx = bitPos % 8;
          bitmapBuf[byteIdx] |= (1 << (7 - bitIdx));
        }

        const { fields: parsed } = parseBitmap(bitmapBuf);
        assert.deepEqual(parsed.sort((a, b) => a - b), sortedFields);
      }),
      { numRuns: 1000 }
    );
  });

  await t.test('Round-trip message packing & unpacking', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[0-9]{4}$/), // MTI
        fc.stringMatching(/^[0-9]{6}$/), // STAN (Field 11)
        fc.stringMatching(/^[0-9]{12}$/), // Amount (Field 4)
        (mti, stan, amount) => {
          const fields = { 4: amount, 11: stan };
          const packed = packIso8583(mti, fields);
          const unpacked = unpackIso8583(packed);

          assert.equal(unpacked.success, true);
          if (unpacked.success) {
            assert.equal(unpacked.value.mti, mti);
            assert.equal(unpacked.value.fields[4], amount);
            assert.equal(unpacked.value.fields[11], stan);
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  await t.test('Fuzz stability: arbitrary bytes never throw unhandled crashes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ minLength: 0, maxLength: 256 }), (bytes) => {
        const buf = Buffer.from(bytes);
        const result = unpackIso8583(buf);
        assert.ok('success' in result);
      }),
      { numRuns: 1000 }
    );
  });
});
