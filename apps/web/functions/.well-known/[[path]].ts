/// <reference types="@cloudflare/workers-types" />

// OAuth discovery for remote MCP clients (RFC 8414 / RFC 9728) lives on the
// API Worker; proxy it like /api/* so the issuer stays on the web domain.
export { onRequest } from "../api/[[path]]";
