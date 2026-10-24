import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { InvoiceItem, InvoicePeriodItem } from '../models/invoice-item.interface';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private ugyfelek = [
    'Kovács János',
    'Nagy Péter',
    'Szabó Anna',
    'Tóth Éva',
    'Varga László',
    'Kiss Katalin',
    'Molnár Gábor',
    'Horváth Zsuzsanna'
  ];

  private statuses = [
    'Felülbírálásra vár',
    'Felülvizsgálva',
    'Ellenőrzésre vár'
  ];

  private directions = ['Bejövő', 'Kimenő'];

  private bizonylatTipusok = ['Számla', 'Nyugta', 'Vámhatározat', 'Egyéb'];

  private invoices: InvoiceItem[] = this.createInvoices([
    ["inv-001", "receipt_long", "Kovács János", "Felülbírálásra vár", "Bejövő", "Számla", "BIZ-2026-000245", "2026-02-09 09:30", true, "kovács jános biz-2026-000245 felülbírálásra vár bejövő számla", [
      ["BIZ-2026-000245", "Felülbírálásra vár", "2026-02-09 09:30", "Számla", ["Szamla_000245.pdf","Szerzodes.pdf"]]
    ]],
    ["inv-002", "receipt_long", "Nagy Péter", "Felülvizsgálva", "Kimenő", "Nyugta", "BIZ-2026-000232", "2026-02-08 14:15", false, "nagy péter biz-2026-000232 felülvizsgálva kimenő nyugta", [
      ["BIZ-2026-000232", "Felülvizsgálva", "2026-02-08 14:15", "Nyugta", ["Nyugta_000232.pdf"]],
      ["BIZ-2026-000232-A1", "Felülvizsgálva", "2026-02-08 15:10", "Nyugta", ["Melleklet_000232_A1.pdf"]]
    ]],
    ["inv-003", "description", "Szabó Anna", "Ellenőrzésre vár", "Bejövő", "Vámhatározat", "BIZ-2026-000198", "2026-02-05 08:05", true, "szabó anna biz-2026-000198 ellenőrzésre vár bejövő vámhatározat", [
      ["BIZ-2026-000198", "Ellenőrzésre vár", "2026-02-05 08:05", "Vámhatározat", ["Vamhat_000198.pdf","Mellekletek_000198.pdf"]]
    ]],
    ["inv-004", "receipt", "Tóth Éva", "Felülvizsgálva", "Kimenő", "Számla", "BIZ-2026-000176", "2026-02-02 13:40", false, "tóth éva biz-2026-000176 felülvizsgálva kimenő számla", [
      ["BIZ-2026-000176", "Felülvizsgálva", "2026-02-02 13:40", "Számla", ["Szamla_000176.pdf"]]
    ]],
    ["inv-005", "receipt", "Varga László", "Felülbírálásra vár", "Bejövő", "Egyéb", "BIZ-2026-000142", "2026-01-28 11:20", false, "varga lászló biz-2026-000142 felülbírálásra vár bejövő egyéb", [
      ["BIZ-2026-000142", "Felülbírálásra vár", "2026-01-28 11:20", "Egyéb", ["Egyeb_000142.pdf"]]
    ]],
    ["inv-006", "receipt_long", "Kiss Katalin", "Ellenőrzésre vár", "Kimenő", "Számla", "BIZ-2026-000119", "2026-01-22 16:05", false, "kiss katalin biz-2026-000119 ellenőrzésre vár kimenő számla", [
      ["BIZ-2026-000119", "Ellenőrzésre vár", "2026-01-22 16:05", "Számla", ["Szamla_000119.pdf","Teljesitesi_igazolas.pdf"]]
    ]],
    ["inv-007", "description", "Molnár Gábor", "Felülvizsgálva", "Bejövő", "Vámhatározat", "BIZ-2025-009881", "2025-12-18 10:12", false, "molnár gábor biz-2025-009881 felülvizsgálva bejövő vámhatározat", [
      ["BIZ-2025-009881", "Felülvizsgálva", "2025-12-18 10:12", "Vámhatározat", ["Vamhat_009881.pdf"]]
    ]],
    ["inv-008", "receipt_long", "Horváth Zsuzsanna", "Ellenőrzésre vár", "Kimenő", "Nyugta", "BIZ-2025-009742", "2025-12-05 09:05", true, "horváth zsuzsanna biz-2025-009742 ellenőrzésre vár kimenő nyugta", [
      ["BIZ-2025-009742", "Ellenőrzésre vár", "2025-12-05 09:05", "Nyugta", ["Nyugta_009742.pdf"]]
    ]]
  ]);

  private createInvoices(seeds: Array<[
    id: string, icon: string, ugyfel: string, status: string, irany: string,
    bizonylatTipus: string, bizonylatSzam: string, datetime: string, unread: boolean, searchKey: string,
    items: Array<[bizonylatSzam: string, status: string, datetime: string, bizonylatTipus: string, attachments: string[]]>
  ]>): InvoiceItem[] {
    return seeds.map(([id, icon, ugyfel, status, irany, bizonylatTipus, bizonylatSzam, datetime, unread, searchKey, items]) => ({
      id, icon, ugyfel, status, irany, bizonylatTipus, bizonylatSzam, datetime, unread, searchKey,
      items: items.map(([bizonylatSzam, status, datetime, bizonylatTipus, attachments]) => ({
        bizonylatSzam, status, datetime, bizonylatTipus, attachments: attachments.map(name => ({ name }))
      }))
    }));
  }

  private periods: InvoicePeriodItem[] = this.createPeriods([
    ["per-001", "Kovács János", "2024-02-01", "2024-02-29", "2024.02.01 - 2024.02.29", "Nyitott", "kovács jános 2024.02.01 2024.02.29 nyitott biz-2026-000245 biz-2026-000232"],
    ["per-002", "Nagy Péter", "2024-01-01", "2024-01-31", "2024.01.01 - 2024.01.31", "Lezárt", "nagy péter 2024.01.01 2024.01.31 lezárt biz-2026-000232"],
    ["per-003", "Szabó Anna", "2023-12-01", "2023-12-31", "2023.12.01 - 2023.12.31", "Nyitott", "szabó anna 2023.12.01 2023.12.31 nyitott biz-2026-000198"],
    ["per-004", "Tóth Éva", "2024-03-01", "2024-03-31", "2024.03.01 - 2024.03.31", "Lezárt", "tóth éva 2024.03.01 2024.03.31 lezárt biz-2026-000176"],
    ["per-005", "Varga László", "2024-04-01", "2024-04-30", "2024.04.01 - 2024.04.30", "Nyitott", "varga lászló 2024.04.01 2024.04.30 nyitott biz-2026-000142"]
  ]);

  private createPeriods(seeds: Array<[
    id: string, ugyfel: string, periodFrom: string, periodTo: string,
    idoszakLabel: string, status: string, searchKey: string
  ]>): InvoicePeriodItem[] {
    return seeds.map(([id, ugyfel, periodFrom, periodTo, idoszakLabel, status, searchKey]) => ({
      id, ugyfel, periodFrom, periodTo, idoszakLabel, status, searchKey
    }));
  }

  getInvoices(): Observable<InvoiceItem[]> {
    return of(this.invoices);
  }

  searchInvoices(query: string): InvoiceItem[] {
    const q = query.toLowerCase();
    if (!q) return [];
    return this.invoices.filter(item => item.searchKey.includes(q));
  }

  getUgyfelek(): string[] {
    return this.ugyfelek;
  }

  getStatuses(): string[] {
    return this.statuses;
  }

  getDirections(): string[] {
    return this.directions;
  }

  getBizonylatTipusok(): string[] {
    return this.bizonylatTipusok;
  }

  getPeriods(): Observable<InvoicePeriodItem[]> {
    return of(this.periods);
  }

  searchPeriods(query: string): InvoicePeriodItem[] {
    const q = query.toLowerCase();
    if (!q) return [];
    return this.periods.filter(item => item.searchKey.includes(q));
  }
}
