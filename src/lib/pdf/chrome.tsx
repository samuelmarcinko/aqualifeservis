import { View, Text, Image } from "@react-pdf/renderer";
import { styles } from "./styles";
import type { PdfCompany } from "./types";
import { formatDate } from "@/lib/format";

interface SignatureClient {
  displayName: string;
  street: string | null;
  postalCode: string | null;
  city: string | null;
}

/**
 * Shared supplier + client signature block used identically by both the
 * quotation and protocol PDFs. When `signedAt` is set (finalized) the supplier
 * side renders the company stamp (if uploaded) plus an automatic date. Both
 * columns reserve the same fixed-height area above the line so the two
 * signature lines stay vertically aligned regardless of the stamp.
 */
export function PdfSignatures({
  company,
  signedAt,
  client,
  supplierLabel = "Dodávateľ",
  clientLabel = "Klient / odberateľ",
}: {
  company: PdfCompany;
  signedAt: string | null;
  client: SignatureClient;
  supplierLabel?: string;
  clientLabel?: string;
}) {
  const clientAddress = [client.street, `${client.postalCode ?? ""} ${client.city ?? ""}`.trim()]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={styles.sigRow} wrap={false}>
      <View style={styles.sigBox}>
        <Text style={styles.sigLabel}>{supplierLabel}</Text>
        <View style={styles.sigArea}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {signedAt && company.stampUrl ? <Image style={styles.sigStamp} src={company.stampUrl} /> : null}
        </View>
        <View style={styles.sigLineTop}>
          <Text style={styles.sigName}>{company.name}</Text>
          <Text style={styles.fieldValue}>
            {company.street}, {company.postalCode} {company.city}
          </Text>
          {signedAt ? (
            <>
              <Text style={styles.sigSigned}>Elektronicky podpísané</Text>
              <Text style={styles.fieldValue}>Dátum: {formatDate(signedAt)}</Text>
            </>
          ) : (
            <View style={styles.dateLineWrap}>
              <Text style={styles.fieldValue}>Dátum:</Text>
              <View style={styles.dateLine} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.sigBox}>
        <Text style={styles.sigLabel}>{clientLabel}</Text>
        <View style={styles.sigArea} />
        <View style={styles.sigLineTop}>
          <Text style={styles.sigName}>{client.displayName}</Text>
          <Text style={styles.fieldValue}>{clientAddress}</Text>
          <View style={styles.dateLineWrap}>
            <Text style={styles.fieldValue}>Dátum:</Text>
            <View style={styles.dateLine} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function PdfHeader({
  company,
  title,
  number,
  revision,
}: {
  company: PdfCompany;
  title: string;
  number: string;
  revision: number;
}) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.logoRow}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {company.logoUrl ? <Image style={styles.logoImg} src={company.logoUrl} /> : null}
        <View style={styles.companyText}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyMeta}>{company.street}</Text>
          <Text style={styles.companyMeta}>
            {company.postalCode} {company.city}
          </Text>
          <Text style={styles.companyMeta}>IČO: {company.ico} · DIČ: {company.dic}</Text>
          {company.icDph ? (
            <Text style={styles.companyMeta}>IČ DPH: {company.icDph}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.docTitleBox}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docNumber}>{number}</Text>
        {revision > 1 ? <Text style={styles.docRevision}>Revízia č. {revision}</Text> : null}
      </View>
    </View>
  );
}

export function PdfFooter({ company }: { company: PdfCompany }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {company.name} · {company.email} · {company.phone}
        {company.website ? ` · ${company.website}` : ""}
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Strana ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}
