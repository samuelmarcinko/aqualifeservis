import sanitizeHtml from "sanitize-html";

/**
 * Strict allowlist sanitizer for user-entered rich text (tool descriptions).
 * The output is rendered on the PUBLIC storefront via dangerouslySetInnerHTML,
 * so we only permit a small set of formatting tags and no attributes that could
 * carry script (no style, no event handlers, links forced to safe schemes).
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "h3",
    "h4",
    "blockquote",
    "a",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    // Normalize legacy/rich-editor tags to the allowed equivalents.
    div: "p",
    h1: "h3",
    h2: "h3",
    h5: "h4",
    h6: "h4",
    // Force safe link behavior.
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }),
  },
  // Drop the content of anything not on the allowlist (e.g. <script>, <style>).
  disallowedTagsMode: "discard",
};

export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  const clean = sanitizeHtml(input, OPTIONS).trim();
  // Treat an editor that only produced empty markup as empty.
  const textOnly = sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} }).trim();
  return textOnly.length === 0 ? "" : clean;
}

/** True when the stored value contains HTML markup (vs. legacy plain text). */
export function looksLikeHtml(value: string | null | undefined): boolean {
  return !!value && /<[a-z][\s\S]*>/i.test(value);
}
