import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { styles } from "./styles";
import { PdfHeader, PdfFooter } from "./chrome";
import type { ProtocolPdfData } from "./types";
import { formatDate, formatDecimal } from "@/lib/format";

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function Para({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.fieldFull}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.para}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function ProtocolDocument({ data }: { data: ProtocolPdfData }) {
  const c = data.company;
  const k = data.customer;

  // Chunk photos into rows of 2 for the photo grid.
  const photoRows: (typeof data.photos)[] = [];
  for (let i = 0; i < data.photos.length; i += 2) {
    photoRows.push(data.photos.slice(i, i + 2));
  }

  return (
    <Document title={`Protokol o oprave ${data.number}`} author={c.name}>
      <Page size="A4" style={styles.page} wrap>
        <PdfHeader
          company={c}
          title="PROTOKOL O OPRAVE"
          number={data.number}
          revision={data.revision}
        />

        <Section title="1. Identifikácia protokolu">
          <View style={styles.fieldGrid}>
            <Field label="Číslo protokolu" value={data.number} />
            <Field label="Číslo poistnej udalosti" value={data.insuranceEventNumber} />
            <Field label="Dátum vyhotovenia" value={formatDate(data.documentDate)} />
            <Field label="Dátum vzniku poruchy" value={data.faultDate ? formatDate(data.faultDate) : null} />
            <Field label="Dátum vykonania opravy" value={data.repairDate ? formatDate(data.repairDate) : null} />
          </View>
        </Section>

        <Section title="2. Údaje o klientovi">
          <View style={styles.fieldGrid}>
            <Field label="Meno / názov" value={k.displayName} />
            <Field label="Kontaktná osoba" value={k.contactPerson} />
            <Field
              label="Adresa"
              value={[k.street, `${k.postalCode ?? ""} ${k.city ?? ""}`.trim(), k.country]
                .filter(Boolean)
                .join(", ")}
            />
            <Field label="Telefón" value={k.phone} />
            <Field label="E-mail" value={k.email} />
            <Field label="IČO" value={k.ico} />
            <Field label="DIČ" value={k.dic} />
            <Field label="IČ DPH" value={k.icDph} />
          </View>
        </Section>

        <Section title="3. Miesto a objekt opravy">
          <View style={styles.fieldGrid}>
            <Field label="Označenie" value={data.serviceAddress?.label ?? null} />
            <Field
              label="Adresa objektu"
              value={
                [data.objectStreet, `${data.objectPostalCode ?? ""} ${data.objectCity ?? ""}`.trim()]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
            <Field label="Typ objektu" value={data.objectType} />
            <Field label="Číslo bytu / poschodie" value={data.objectApartment} />
            <Field label="Číslo poistnej zmluvy" value={data.insuranceContractNumber} />
            <Field label="Poisťovňa" value={data.insurer} />
            <Para label="Poznámka k objektu" value={data.objectNote} />
          </View>
        </Section>

        <Section title="4. Diagnostika poruchy">
          <View style={styles.fieldGrid}>
            <Field label="Typ poruchy" value={data.faultType} />
            <Para label="Príčina poruchy" value={data.faultCause} />
            <Para label="Podrobný popis poruchy" value={data.faultDescription} />
            <Para label="Rozsah poškodenia" value={data.damageExtent} />
          </View>
        </Section>

        {data.workItems.length > 0 ? (
          <Section title="5. Vykonané práce a použitý materiál">
            <View style={styles.table}>
              <View style={styles.tHead}>
                <Text style={[styles.tHeadCell, { width: "8%" }]}>#</Text>
                <Text style={[styles.tHeadCell, { width: "70%" }]}>Popis</Text>
                <Text style={[styles.tHeadCell, { width: "12%", textAlign: "right" }]}>Množ.</Text>
                <Text style={[styles.tHeadCell, { width: "10%", textAlign: "center" }]}>MJ</Text>
              </View>
              {data.workItems.map((w) => (
                <View style={styles.tRow} key={w.position} wrap={false}>
                  <Text style={[styles.tCell, { width: "8%" }]}>{w.position}</Text>
                  <Text style={[styles.tCell, { width: "70%" }]}>{w.description}</Text>
                  <Text style={[styles.tCell, { width: "12%", textAlign: "right" }]}>
                    {w.quantity ? formatDecimal(w.quantity) : "—"}
                  </Text>
                  <Text style={[styles.tCell, { width: "10%", textAlign: "center" }]}>
                    {w.unit ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {(data.technicianStatement || data.notes || data.recommendations) && (
          <Section title="6. Vyjadrenie technika / poznámky">
            <Para label="Vyjadrenie technika" value={data.technicianStatement} />
            <Para label="Poznámky" value={data.notes} />
            <Para label="Odporúčania" value={data.recommendations} />
          </Section>
        )}

        {/* 8. Signatures — kept on the same/last text page */}
        <View style={styles.sigRow} wrap={false}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Dodávateľ opravy</Text>
            <View style={styles.sigLine}>
              <Text style={styles.sigName}>{c.name}</Text>
              <Text style={styles.fieldValue}>
                {c.street}, {c.postalCode} {c.city}
              </Text>
              <Text style={styles.fieldValue}>Dátum: ______________</Text>
            </View>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Klient / odberateľ</Text>
            <View style={styles.sigLine}>
              <Text style={styles.sigName}>{k.displayName}</Text>
              <Text style={styles.fieldValue}>
                {[k.street, `${k.postalCode ?? ""} ${k.city ?? ""}`.trim()].filter(Boolean).join(", ")}
              </Text>
              <Text style={styles.fieldValue}>Dátum: ______________</Text>
            </View>
          </View>
        </View>

        <PdfFooter company={c} />
      </Page>

      {/* Photo documentation — separate page(s) */}
      {data.photos.length > 0 ? (
        <Page size="A4" style={styles.page} wrap>
          <PdfHeader
            company={c}
            title="PROTOKOL O OPRAVE"
            number={data.number}
            revision={data.revision}
          />
          <Text style={styles.sectionTitle}>7. Fotodokumentácia</Text>
          <View style={{ marginTop: 8 }}>
            {photoRows.map((row, ri) => (
              <View style={styles.photoRow} key={ri} wrap={false}>
                {row.map((p, pi) => (
                  <View style={styles.photoCell} key={pi}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image style={styles.photoImg} src={p.url} />
                    <Text style={styles.photoCat}>{p.categoryLabel}</Text>
                    {p.caption ? <Text style={styles.photoCap}>{p.caption}</Text> : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
          <PdfFooter company={c} />
        </Page>
      ) : null}
    </Document>
  );
}
