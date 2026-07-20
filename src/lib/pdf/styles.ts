import { StyleSheet } from "@react-pdf/renderer";

export const COLORS = {
  light: "#2FA0E4",
  dark: "#114EA9",
  navy: "#0B2C5E",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E2E8F0",
  soft: "#F1F6FC",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: COLORS.text,
    paddingTop: 36,
    paddingBottom: 60,
    paddingHorizontal: 36,
    lineHeight: 1.4,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.dark,
    paddingBottom: 12,
    marginBottom: 16,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoImg: { width: 42, height: 42, objectFit: "contain" },
  companyName: { fontSize: 14, fontWeight: 700, color: COLORS.navy },
  companyMeta: { fontSize: 8, color: COLORS.muted },
  docTitleBox: { alignItems: "flex-end" },
  docTitle: { fontSize: 18, fontWeight: 700, color: COLORS.dark },
  docNumber: { fontSize: 11, fontWeight: 500, color: COLORS.text, marginTop: 2 },
  docRevision: { fontSize: 8, color: COLORS.muted },

  // Party boxes
  partyRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 10,
  },
  partyLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: COLORS.light,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  partyName: { fontSize: 10, fontWeight: 700, color: COLORS.navy },
  partyLine: { fontSize: 8.5, color: COLORS.text },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  metaItem: { width: "25%", marginBottom: 4 },
  metaLabel: { fontSize: 7, color: COLORS.muted, textTransform: "uppercase" },
  metaValue: { fontSize: 9, fontWeight: 500, color: COLORS.text },

  // Section
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#fff",
    backgroundColor: COLORS.dark,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 8,
  },

  // Table
  table: { width: "100%" },
  tHead: {
    flexDirection: "row",
    backgroundColor: COLORS.soft,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark,
  },
  tHeadCell: {
    fontSize: 7.5,
    fontWeight: 700,
    color: COLORS.navy,
    padding: 5,
    textTransform: "uppercase",
  },
  tRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tCell: { fontSize: 8.5, padding: 5, color: COLORS.text },
  tDetail: { fontSize: 7.5, color: COLORS.muted },

  // Column widths (quotation)
  colPos: { width: "5%" },
  colDesc: { width: "37%" },
  colQty: { width: "9%", textAlign: "right" },
  colUnit: { width: "8%", textAlign: "center" },
  colPrice: { width: "13%", textAlign: "right" },
  colDisc: { width: "9%", textAlign: "right" },
  colVat: { width: "8%", textAlign: "right" },
  colNet: { width: "11%", textAlign: "right" },

  // Totals
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox: { width: "50%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalLabel: { fontSize: 9, color: COLORS.muted },
  totalValue: { fontSize: 9, fontWeight: 500, color: COLORS.text },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.dark,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  grandLabel: { fontSize: 10, fontWeight: 700, color: "#fff" },
  grandValue: { fontSize: 11, fontWeight: 700, color: "#fff" },

  note: {
    marginTop: 14,
    padding: 8,
    backgroundColor: COLORS.soft,
    borderRadius: 3,
    fontSize: 8.5,
    color: COLORS.text,
  },
  reverseChargeNote: {
    marginTop: 8,
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.dark,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: COLORS.muted },

  // Protocol fields
  fieldGrid: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "50%", marginBottom: 6, paddingRight: 8 },
  fieldFull: { width: "100%", marginBottom: 6 },
  fieldLabel: { fontSize: 7, color: COLORS.muted, textTransform: "uppercase" },
  fieldValue: { fontSize: 9, color: COLORS.text },
  para: { fontSize: 9, color: COLORS.text, marginBottom: 4 },

  // Photos
  photoRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  photoCell: { width: "48%", borderWidth: 1, borderColor: COLORS.border, borderRadius: 3, padding: 4 },
  photoImg: { width: "100%", height: 150, objectFit: "cover", borderRadius: 2 },
  photoCat: { fontSize: 7, fontWeight: 700, color: COLORS.light, marginTop: 3 },
  photoCap: { fontSize: 8, color: COLORS.text },

  // Signatures
  sigRow: { flexDirection: "row", gap: 24, marginTop: 30 },
  sigBox: { flex: 1 },
  sigLine: { borderTopWidth: 1, borderTopColor: COLORS.text, marginTop: 40, paddingTop: 4 },
  sigLabel: { fontSize: 7, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase" },
  sigName: { fontSize: 9, color: COLORS.text },
});
