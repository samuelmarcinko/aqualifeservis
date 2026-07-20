export interface NavItem {
  href: string;
  label: string;
  icon: string; // inline SVG path (24x24)
  superAdminOnly?: boolean;
}

// Simple line icons (Heroicons-style single-path where possible).
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/prehlad",
    label: "Prehľad",
    icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10",
  },
  {
    href: "/zakaznici",
    label: "Zákazníci",
    icon: "M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m6-1.13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z",
  },
  {
    href: "/cenove-ponuky",
    label: "Cenové ponuky",
    icon: "M9 12h6M9 16h6M9 8h6M5 3h11l4 4v14H5z",
  },
  {
    href: "/protokoly",
    label: "Protokoly o oprave",
    icon: "M9 5H5v16h14V9l-4-4H9zM9 5v4h6M9 13h6M9 17h4",
  },
  {
    href: "/katalog",
    label: "Katalóg položiek",
    icon: "M4 6h16M4 12h16M4 18h16",
  },
  {
    href: "/pouzivatelia",
    label: "Používatelia",
    icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21v-1a6 6 0 0 1 12 0v1",
    superAdminOnly: true,
  },
  {
    href: "/nastavenia",
    label: "Nastavenia",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L16 3H8l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L8 21h8l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6z",
    superAdminOnly: true,
  },
];
