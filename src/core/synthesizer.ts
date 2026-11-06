/**
 * AuraGate Core Synthesizer: Legacy Wire to OpenAPI 3.1 & TypeScript Generator
 */

import { IsoMessage, STANDARD_ISO_FIELDS } from './iso8583.js';

export interface FieldSchemaSpec {
  name: string;
  type: 'string' | 'integer' | 'number';
  format?: string;
  description: string;
  example?: string | number;
}

export interface SynthesizedResult {
  openApiSpec: Record<string, unknown>;
  typeScriptDefinitions: string;
}

/**
 * Derives field types and patterns from standard ISO-8583 definitions and extracted values.
 */
function inferIsoFieldSchema(fieldNum: number, value: string): FieldSchemaSpec {
  const def = STANDARD_ISO_FIELDS[fieldNum];
  const fieldName = def ? def.name : `field_${fieldNum}`;

  if (/^\d+$/.test(value)) {
    // Numeric string or integer
    if (fieldName === 'amount') {
      return {
        name: fieldName,
        type: 'number',
        description: `ISO-8583 Field ${fieldNum}: ${fieldName} (implied 2 decimal places)`,
        example: parseFloat((parseInt(value, 10) / 100).toFixed(2))
      };
    }
    return {
      name: fieldName,
      type: 'integer',
      description: `ISO-8583 Field ${fieldNum}: ${fieldName}`,
      example: parseInt(value, 10)
    };
  }

  return {
    name: fieldName,
    type: 'string',
    description: `ISO-8583 Field ${fieldNum}: ${fieldName}`,
    example: value
  };
}

/**
 * Synthesizes a valid OpenAPI 3.1 specification and TypeScript types from an IsoMessage.
 */
export function synthesizeFromIso(message: IsoMessage, title: string = 'AuraGate Synthesized Payment API'): SynthesizedResult {
  const properties: Record<string, Record<string, unknown>> = {
    mti: {
      type: 'string',
      pattern: '^[0-9]{4}$',
      description: 'Message Type Identifier (MTI)',
      example: message.mti
    }
  };

  const tsFields: string[] = [
    `  /** Message Type Identifier */\n  mti: '${message.mti}';`
  ];

  for (const fieldNum of message.presentFields) {
    const rawVal = message.fields[fieldNum] ?? '';
    const schema = inferIsoFieldSchema(fieldNum, rawVal);

    properties[schema.name] = {
      type: schema.type,
      description: schema.description,
      example: schema.example
    };

    const tsType = schema.type === 'string' ? 'string' : 'number';
    tsFields.push(`  /** ${schema.description} */\n  ${schema.name}?: ${tsType};`);
  }

  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title,
      version: '1.0.0',
      description: 'Auto-synthesized modern REST contract generated from legacy ISO-8583 bitstream.'
    },
    paths: {
      '/api/v1/transactions/process': {
        post: {
          summary: `Process ${message.mti} Transaction`,
          operationId: `processIso${message.mti}`,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TransactionPayload'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Transaction processed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'APPROVED' },
                      responseCode: { type: 'string', example: '00' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        TransactionPayload: {
          type: 'object',
          required: ['mti'],
          properties
        }
      }
    }
  };

  const typeScriptDefinitions = `export interface TransactionPayload {\n${tsFields.join('\n')}\n}\n`;

  return { openApiSpec, typeScriptDefinitions };
}
