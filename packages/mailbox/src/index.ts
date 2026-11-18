export {
  extractAddresses,
  hasAddresses,
  isAddressedTo,
  parseMailboxes,
  sameAddress,
  singleMailbox,
  type Mailbox,
} from "./address";
export {
  authenticationOf,
  dkimSigningDomains,
  isAligned,
  senderVerdict,
  type InboundAuthentication,
} from "./authentication";
export { composeMessage, composeNotification, mailIdentity, type MailIdentity } from "./compose";
export {
  handleInboundWebhook,
  parseTimestamp,
  recordInboundEmail,
  type InboundDeps,
  type InboundOutcome,
  type RecordResult,
} from "./inbound";
export {
  ATTACHMENT_LIMIT,
  UNCLEAR_RECIPIENT,
  replyToThread,
  startThread,
  type OutboundDeps,
  type SendResult,
} from "./outbound";
export {
  THREAD_VIEWS,
  addMessage,
  countThreads,
  createThread,
  findOrderByReference,
  getMessage,
  getThread,
  linkOrder,
  listThreads,
  matchThread,
  orderEmail,
  ordersForAddress,
  setThreadStatus,
  type OrderSummary,
  type ThreadDetail,
  type ThreadSummary,
  type ThreadView,
} from "./store";
export {
  headerValue,
  normalizeSubject,
  orderReference,
  orderReferences,
  parseMessageIds,
  referenceChain,
  replySubject,
} from "./subject";
export { escapeHtml, htmlToText, readableBody, snippet, withoutQuotedHistory, withoutSignature } from "./text";
export type {
  MailTransport,
  OutgoingAttachment,
  OutgoingEmail,
  ReceivedEmail,
  ReceivedEmailEvent,
  WebhookEvent,
  WebhookHeaders,
} from "./transport";
export type { Database, DbExecutor } from "./types";
