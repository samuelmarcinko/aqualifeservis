import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { registerPdfFonts } from "./fonts";
import { QuotationDocument } from "./quotation-document";
import { ProtocolDocument } from "./protocol-document";
import type { QuotationPdfData, ProtocolPdfData } from "./types";

// QuotationDocument / ProtocolDocument render a <Document> at their root; the
// cast bridges our component element to the DocumentProps element the renderer
// expects.
export async function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  registerPdfFonts();
  const el = createElement(QuotationDocument, { data }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(el);
}

export async function renderProtocolPdf(data: ProtocolPdfData): Promise<Buffer> {
  registerPdfFonts();
  const el = createElement(ProtocolDocument, { data }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(el);
}
