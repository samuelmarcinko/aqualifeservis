import { View, Text, Image } from "@react-pdf/renderer";
import { styles } from "./styles";
import type { PdfCompany } from "./types";

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
        <View>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyMeta}>
            {company.street}, {company.postalCode} {company.city}
          </Text>
          <Text style={styles.companyMeta}>
            IČO: {company.ico} · DIČ: {company.dic}
            {company.icDph ? ` · IČ DPH: ${company.icDph}` : ""}
          </Text>
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
