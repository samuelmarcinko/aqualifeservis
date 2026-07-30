import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";
import { PdfHeader, PdfFooter, PdfSignatures } from "./chrome";
import type { QuotationPdfData } from "./types";
import { formatCurrency, formatDate, formatDecimal, formatPercent } from "@/lib/format";

function PartyLines({ lines }: { lines: (string | null)[] }) {
  return (
    <>
      {lines.filter(Boolean).map((l, i) => (
        <Text key={i} style={styles.partyLine}>
          {l}
        </Text>
      ))}
    </>
  );
}

export function QuotationDocument({ data }: { data: QuotationPdfData }) {
  const c = data.company;
  const k = data.customer;
  const showVat = data.taxMode === "STANDARD";

  return (
    <Document title={`Cenová ponuka ${data.number}`} author={c.name}>
      <Page size="A4" style={styles.page} wrap>
        <PdfHeader company={c} title="CENOVÁ PONUKA" number={data.number} revision={data.revision} />

        {/* Parties */}
        <View style={styles.partyRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Dodávateľ</Text>
            <Text style={styles.partyName}>{c.name}</Text>
            <PartyLines
              lines={[
                c.street,
                `${c.postalCode} ${c.city}`,
                c.country,
                `IČO: ${c.ico}`,
                `DIČ: ${c.dic}`,
                c.icDph ? `IČ DPH: ${c.icDph}` : null,
                c.email,
                c.phone,
              ]}
            />
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Odberateľ</Text>
            <Text style={styles.partyName}>{k.displayName}</Text>
            <PartyLines
              lines={[
                k.contactPerson,
                k.street,
                `${k.postalCode ?? ""} ${k.city ?? ""}`.trim() || null,
                k.country,
                k.ico ? `IČO: ${k.ico}` : null,
                k.dic ? `DIČ: ${k.dic}` : null,
                k.icDph ? `IČ DPH: ${k.icDph}` : null,
                k.email,
                k.phone,
              ]}
            />
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Dátum vystavenia</Text>
            <Text style={styles.metaValue}>{formatDate(data.issueDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Platnosť do</Text>
            <Text style={styles.metaValue}>{formatDate(data.validUntil)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Mena</Text>
            <Text style={styles.metaValue}>EUR</Text>
          </View>
          {data.serviceAddress ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Miesto</Text>
              <Text style={styles.metaValue}>{data.serviceAddress.label}</Text>
            </View>
          ) : null}
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tHead} fixed>
            <Text style={[styles.tHeadCell, styles.colPos]}>#</Text>
            <Text style={[styles.tHeadCell, styles.colDesc]}>Popis</Text>
            <Text style={[styles.tHeadCell, styles.colQty]}>Množ.</Text>
            <Text style={[styles.tHeadCell, styles.colUnit]}>MJ</Text>
            <Text style={[styles.tHeadCell, styles.colPrice]}>Cena/MJ</Text>
            <Text style={[styles.tHeadCell, styles.colDisc]}>Zľava</Text>
            {showVat ? <Text style={[styles.tHeadCell, styles.colVat]}>DPH</Text> : null}
            <Text style={[styles.tHeadCell, styles.colNet]}>Spolu bez DPH</Text>
          </View>
          {data.items.map((it) => (
            <View style={styles.tRow} key={it.position} wrap={false}>
              <Text style={[styles.tCell, styles.colPos]}>{it.position}</Text>
              <View style={[styles.tCell, styles.colDesc]}>
                <Text>{it.description}</Text>
                {it.detail ? <Text style={styles.tDetail}>{it.detail}</Text> : null}
              </View>
              <Text style={[styles.tCell, styles.colQty]}>{formatDecimal(it.quantity)}</Text>
              <Text style={[styles.tCell, styles.colUnit]}>{it.unit}</Text>
              <Text style={[styles.tCell, styles.colPrice]}>{formatCurrency(it.unitPrice)}</Text>
              <Text style={[styles.tCell, styles.colDisc]}>
                {Number(it.discountPct) > 0 ? formatPercent(it.discountPct) : "—"}
              </Text>
              {showVat ? (
                <Text style={[styles.tCell, styles.colVat]}>{formatPercent(it.vatRate)}</Text>
              ) : null}
              <Text style={[styles.tCell, styles.colNet]}>{formatCurrency(it.lineNet)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Medzisúčet bez DPH</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
            </View>
            {Number(data.discountTotal) > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Zľava</Text>
                <Text style={styles.totalValue}>−{formatCurrency(data.discountTotal)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Základ dane</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.taxBase)}</Text>
            </View>
            {showVat
              ? data.vatBreakdown.map((v) => (
                  <View style={styles.totalRow} key={v.rate}>
                    <Text style={styles.totalLabel}>DPH {formatPercent(v.rate)}</Text>
                    <Text style={styles.totalValue}>{formatCurrency(v.vat)}</Text>
                  </View>
                ))
              : null}
            {showVat ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>DPH spolu</Text>
                <Text style={styles.totalValue}>{formatCurrency(data.vatTotal)}</Text>
              </View>
            ) : null}
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Celkom {showVat ? "s DPH" : ""}</Text>
              <Text style={styles.grandValue}>{formatCurrency(data.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {data.taxMode === "REVERSE_CHARGE" ? (
          <Text style={styles.reverseChargeNote}>Prenesenie daňovej povinnosti.</Text>
        ) : null}
        {data.taxMode === "NO_VAT" && data.noVatNote ? (
          <Text style={styles.note}>{data.noVatNote}</Text>
        ) : null}

        {data.customerNote ? (
          <View style={styles.note}>
            <Text>{data.customerNote}</Text>
          </View>
        ) : null}

        <PdfSignatures
          company={c}
          signedAt={data.signedAt}
          client={{
            displayName: k.displayName,
            street: k.street,
            postalCode: k.postalCode,
            city: k.city,
          }}
          supplierLabel="Dodávateľ"
          clientLabel="Odberateľ"
        />

        <PdfFooter company={c} />
      </Page>
    </Document>
  );
}
