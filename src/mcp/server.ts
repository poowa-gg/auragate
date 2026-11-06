/**
 * AuraGate Model Context Protocol (MCP) Server
 * Exposes wire inspection and autonomous schema synthesis tools to Kiro.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { unpackIso8583 } from '../core/iso8583.js';
import { decodeCp037, decodeComp3 } from '../core/ebcdic.js';
import { synthesizeFromIso } from '../core/synthesizer.js';

const server = new Server(
  {
    name: 'auragate-mcp',
    version: '0.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register available MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'inspect_iso8583_stream',
        description: 'Parses a raw hex or base64 ISO-8583 financial buffer and returns unpacked fields.',
        inputSchema: {
          type: 'object',
          properties: {
            payload: { type: 'string', description: 'Hex or Base64 encoded ISO-8583 payload' },
            encoding: { type: 'string', enum: ['hex', 'base64'], default: 'hex' }
          },
          required: ['payload']
        }
      },
      {
        name: 'inspect_ebcdic_stream',
        description: 'Decodes a CP037 EBCDIC byte buffer and optional COMP-3 packed decimals.',
        inputSchema: {
          type: 'object',
          properties: {
            payload: { type: 'string', description: 'Hex encoded EBCDIC payload' },
            comp3Offset: { type: 'number', description: 'Optional byte offset for COMP-3 packed decimal' },
            comp3Length: { type: 'number', description: 'Optional length of COMP-3 packed decimal buffer' }
          },
          required: ['payload']
        }
      },
      {
        name: 'synthesize_microservice',
        description: 'Generates an OpenAPI 3.1 specification and TypeScript types from a legacy ISO-8583 sample.',
        inputSchema: {
          type: 'object',
          properties: {
            payload: { type: 'string', description: 'Hex encoded ISO-8583 payload' },
            serviceName: { type: 'string', description: 'Name of the synthesized modern service' }
          },
          required: ['payload']
        }
      }
    ]
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'inspect_iso8583_stream') {
      const payloadStr = String(args?.payload ?? '');
      const encoding = (args?.encoding as BufferEncoding) || 'hex';
      const buf = Buffer.from(payloadStr, encoding);

      const unpacked = unpackIso8583(buf);
      if (!unpacked.success) {
        return {
          content: [{ type: 'text', text: `Unpack Error: ${unpacked.error.code} - ${unpacked.error.message}` }],
          isError: true
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(unpacked.value, null, 2) }]
      };
    }

    if (name === 'inspect_ebcdic_stream') {
      const hexPayload = String(args?.payload ?? '');
      const buf = Buffer.from(hexPayload, 'hex');
      const textResult = decodeCp037(buf);

      const response: Record<string, unknown> = {
        decodedText: textResult.success ? textResult.value : null
      };

      if (typeof args?.comp3Offset === 'number' && typeof args?.comp3Length === 'number') {
        const slice = buf.subarray(args.comp3Offset, args.comp3Offset + args.comp3Length);
        const comp3Result = decodeComp3(slice);
        response.comp3Value = comp3Result.success ? comp3Result.value : comp3Result.error;
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
      };
    }

    if (name === 'synthesize_microservice') {
      const hexPayload = String(args?.payload ?? '');
      const serviceName = String(args?.serviceName ?? 'AuraGate Bridge Service');
      const buf = Buffer.from(hexPayload, 'hex');

      const unpacked = unpackIso8583(buf);
      if (!unpacked.success) {
        return {
          content: [{ type: 'text', text: `Failed to unpack wire payload for synthesis: ${unpacked.error.message}` }],
          isError: true
        };
      }

      const synthesized = synthesizeFromIso(unpacked.value, serviceName);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(synthesized, null, 2)
          }
        ]
      };
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `Internal server error: ${message}` }],
      isError: true
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((error) => {
  console.error('Fatal MCP Server Error:', error);
  process.exit(1);
});
