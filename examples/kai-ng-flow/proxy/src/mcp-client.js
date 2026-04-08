import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { parseJsonSafely } from './utils.js';

export function createMcpService({ mcpServerUrl, logger }) {
    let mcpConnectionPromise = null;
    let mcpContextPromise = null;

    async function connectToMcpServer() {
        if (mcpConnectionPromise) return mcpConnectionPromise;

        mcpConnectionPromise = (async () => {
            const serverUrl = new URL(mcpServerUrl);
            logger.info('Connecting to Vant MCP server', { url: serverUrl.toString() });

            const trySse = async (targetUrl) => {
                const transport = new SSEClientTransport(targetUrl);
                const client = new McpClient({
                    name: 'vant-flow-example-proxy',
                    version: '1.0.0'
                });
                client.onerror = (error) => {
                    logger.warn('MCP client error', { error: String(error?.message || error) });
                };
                await client.connect(transport);
                return { client, transport, transportType: 'sse', url: targetUrl.toString() };
            };

            try {
                if (serverUrl.pathname.endsWith('/sse')) {
                    const sseConnection = await trySse(serverUrl);
                    logger.info('Connected to Vant MCP server', {
                        transport: sseConnection.transportType,
                        url: sseConnection.url
                    });
                    return sseConnection;
                }

                const transport = new StreamableHTTPClientTransport(serverUrl);
                const client = new McpClient({
                    name: 'vant-flow-example-proxy',
                    version: '1.0.0'
                });
                client.onerror = (error) => {
                    logger.warn('MCP client error', { error: String(error?.message || error) });
                };
                await client.connect(transport);
                logger.info('Connected to Vant MCP server', {
                    transport: 'streamable-http',
                    url: serverUrl.toString()
                });
                return { client, transport, transportType: 'streamable-http', url: serverUrl.toString() };
            } catch (streamableError) {
                const fallbackUrl = serverUrl.pathname.endsWith('/sse')
                    ? serverUrl
                    : new URL('/sse', serverUrl);
                logger.warn('Streamable MCP connection failed, falling back to SSE', {
                    requestedUrl: serverUrl.toString(),
                    fallbackUrl: fallbackUrl.toString(),
                    error: String(streamableError?.message || streamableError)
                });
                const sseConnection = await trySse(fallbackUrl);
                logger.info('Connected to Vant MCP server', {
                    transport: sseConnection.transportType,
                    url: sseConnection.url
                });
                return sseConnection;
            }
        })().catch((error) => {
            mcpConnectionPromise = null;
            throw error;
        });

        return mcpConnectionPromise;
    }

    async function callMcpTool(name, args = {}) {
        const { client } = await connectToMcpServer();
        logger.info('Calling Vant MCP tool', { name, args });
        const result = await client.callTool({ name, arguments: args });
        const text = Array.isArray(result?.content)
            ? result.content
                .filter(item => item?.type === 'text' && typeof item.text === 'string')
                .map(item => item.text)
                .join('\n')
                .trim()
            : '';
        logger.info('Vant MCP tool completed', {
            name,
            textSnippet: text ? `${text.slice(0, 200)}${text.length > 200 ? '...' : ''}` : 'EMPTY'
        });
        return { result, text };
    }

    async function getMcpScaffoldContext() {
        if (mcpContextPromise) return mcpContextPromise;

        mcpContextPromise = (async () => {
            const capabilitiesResponse = await callMcpTool('get_capabilities');
            const modelsResponse = await callMcpTool('get_models');
            const fieldTypesResponse = await callMcpTool('get_field_types');
            const rendererContractResponse = await callMcpTool('get_renderer_contract');
            const builderContractResponse = await callMcpTool('get_builder_contract');
            const exampleSchemasResponse = await callMcpTool('get_example_schemas');
            const capabilities = parseJsonSafely(capabilitiesResponse.text) || {};
            const context = {
                capabilities,
                models: modelsResponse.text || '',
                fieldTypes: fieldTypesResponse.text || '',
                rendererContract: rendererContractResponse.text || '',
                builderContract: builderContractResponse.text || '',
                exampleSchemas: exampleSchemasResponse.text || ''
            };
            logger.info('Vant MCP context loaded', {
                toolCount: Array.isArray(capabilities.tools) ? capabilities.tools.length : 0,
                tools: Array.isArray(capabilities.tools) ? capabilities.tools.map(tool => tool.name) : [],
                hasModels: !!context.models,
                hasFieldTypes: !!context.fieldTypes,
                hasRendererContract: !!context.rendererContract,
                hasBuilderContract: !!context.builderContract,
                hasExampleSchemas: !!context.exampleSchemas
            });
            return context;
        })().catch((error) => {
            mcpContextPromise = null;
            throw error;
        });

        return mcpContextPromise;
    }

    return {
        callMcpTool,
        getMcpScaffoldContext
    };
}
