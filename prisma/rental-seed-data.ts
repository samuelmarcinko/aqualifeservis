// Initial rental catalogue supplied by AQUALIFE. Prices are €/day excl. VAT.
export const RENTAL_SEED: {
  category: string;
  description?: string;
  tools: { name: string; price: number; description?: string; accessories?: string[] }[];
}[] = [
  {
    category: "Čistiaca technika",
    tools: [
      {
        name: "Mechanická čistička potrubí a odtokov",
        price: 30,
        description:
          "Profesionálne zariadenie určené predovšetkým na čistenie potrubí s menším priemerom – od umývadlových odtokov DN 32 až po kanalizačné potrubia DN 110.",
        accessories: ["akumulátorové náradie", "3 plne nabité batérie", "príslušenstvo na čistenie potrubia"],
      },
      {
        name: "Benzínový vysokotlakový čistič kanalizácie",
        price: 30,
        description:
          "Výkonný vysokotlakový čistič určený na čistenie kanalizačného potrubia do priemeru približne DN 110 až DN 125.",
        accessories: ["40-metrová kanalizačná čistiaca hadica", "3 hydrantové hadice s dĺžkou 20 metrov", "potrebné napojenia"],
      },
    ],
  },
  {
    category: "Monitoring kanalizácie",
    tools: [
      {
        name: "Kanalizačná kamera s 40-metrovým káblom",
        price: 25,
        description:
          "Profesionálny kamerový systém určený na monitoring kanalizačného potrubia. Umožňuje odhaliť poškodenia, upchaté miesta, praskliny, netesnosti alebo nesprávne napojenia potrubia. Dĺžka kábla: 40 m.",
      },
      {
        name: "Kamera na malé priemery potrubia",
        price: 20,
        description:
          "Kompaktná kamera s priemerom kamerovej hlavy 17 mm, vhodná predovšetkým na kontrolu umývadlových odtokov a potrubí s menším priemerom. Dĺžka kábla: 20 m.",
      },
    ],
  },
  {
    category: "Lokalizácia kanalizácie a potrubia",
    tools: [
      {
        name: "Profesionálny lokalizátor potrubia",
        price: 45,
        description:
          "Zariadenie určené na presnú lokalizáciu kanalizačného potrubia, sond a miest poruchy pod zemou. K dispozícii sú dve sondy: malá pre potrubia približne od DN 50 a veľká pre potrubia s väčším priemerom.",
      },
      {
        name: "Malá kanalizačná sonda",
        price: 15,
        description: "Kompaktná sonda vhodná na lokalizáciu menších priemerov potrubia.",
      },
      {
        name: "Veľká kanalizačná sonda",
        price: 20,
        description:
          "Výkonná kanalizačná sonda vhodná aj do náročnejších podmienok. Signál sondy je možné lokalizovať až z hĺbky približne 5 metrov.",
      },
    ],
  },
  {
    category: "Lokalizácia úniku vody",
    tools: [
      {
        name: "Elektroakustický lokalizátor únikov vody",
        price: 150,
        description:
          "Profesionálne zariadenie určené na presnú lokalizáciu únikov vody v tlakových vodovodných potrubiach. Pomocou citlivých snímačov dokáže zachytiť zvuk unikajúcej vody a pomôcť určiť miesto poruchy bez zbytočného rozsiahleho búrania.",
      },
    ],
  },
  {
    category: "Vodoinštalatérske náradie",
    tools: [
      {
        name: "Akumulátorový radiálny lis",
        price: 20,
        description:
          "Profesionálny lis určený na lisovanie plastohliníkového potrubia. Súčasťou kufríka sú lisovacie čeľuste s rozmermi 16, 20, 26 a 32 mm.",
        accessories: ["lisovacie čeľuste 16 mm", "lisovacie čeľuste 20 mm", "lisovacie čeľuste 26 mm", "lisovacie čeľuste 32 mm"],
      },
    ],
  },
  {
    category: "Odčerpávanie vody",
    tools: [
      {
        name: "Kalové čerpadlo",
        price: 15,
        description:
          "Výkonné kalové čerpadlo určené na odčerpávanie čistej aj znečistenej vody zo zatopených priestorov, šácht, pivníc alebo nádrží. Možno pripojiť jednu až tri palcové hydrantové hadice s dĺžkou približne 10 až 20 metrov vrátane potrebných napojení.",
      },
    ],
  },
  {
    category: "Zváranie plastového potrubia",
    tools: [
      {
        name: "Polyfúzna zváračka na PPR potrubie",
        price: 10,
        description:
          "Polyfúzna zváračka s výkonom 1 850 W určená na spájanie plastových PPR rúr a tvaroviek. Vhodná na realizáciu aj opravy vodovodných a vykurovacích rozvodov.",
      },
    ],
  },
];
