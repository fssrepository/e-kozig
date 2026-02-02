import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DocumentItem } from '../models/document-item.interface';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documents: DocumentItem[] = [
    {
      icon: 'description',
      ugyfel: 'Acme',
      description: 'Contract agreement',
      datetime: '2026-02-01 10:00',
      unread: true,
      searchKey: 'acme contract agreement ikt-2026-000123 kr-450021',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-02-01 10:00',
          iktatoszam: 'IKT-2026-000123',
          krSzam: 'KR-450021',
          attachments: [
            { name: 'Acme dokumentum 1.pdf' },
            { name: 'Acme dokumentum 2.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2026-02-02 10:00',
          iktatoszam: 'IKT-2026-000124',
          krSzam: 'KR-450022',
          attachments: [
            { name: 'Acme dokumentum 3.pdf' },
            { name: 'Acme dokumentum 4.pdf' },
            { name: 'Acme dokumentum 5.pdf' }
          ]
        },
        {
          description: 'Harmadik eljárási lépés',
          datetime: '2026-02-03 10:00',
          iktatoszam: 'IKT-2026-000125',
          krSzam: 'KR-450023',
          attachments: [
            { name: 'Acme dokumentum 6.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'insert_drive_file',
      ugyfel: 'Globex',
      description: 'Invoice #1234',
      datetime: '2026-01-22 14:30',
      unread: false,
      searchKey: 'globex invoice 1234 ikt-2026-000200 kr-450101',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-01-22 14:30',
          iktatoszam: 'IKT-2026-000200',
          krSzam: 'KR-450101',
          attachments: [
            { name: 'Globex dokumentum 1.pdf' },
            { name: 'Globex dokumentum 2.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2026-01-23 14:30',
          iktatoszam: 'IKT-2026-000201',
          krSzam: 'KR-450102',
          attachments: [
            { name: 'Globex dokumentum 3.pdf' }
          ]
        },
        {
          description: 'Harmadik eljárási lépés',
          datetime: '2026-01-24 14:30',
          iktatoszam: 'IKT-2026-000202',
          krSzam: 'KR-450103',
          attachments: [
            { name: 'Globex dokumentum 4.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'description',
      ugyfel: 'Wayne Enterprises',
      description: 'NDA document',
      datetime: '2025-12-10 09:15',
      unread: false,
      searchKey: 'wayne enterprises nda document ikt-2025-000987 kr-440310',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2025-12-10 09:15',
          iktatoszam: 'IKT-2025-000987',
          krSzam: 'KR-440310',
          attachments: [
            { name: 'Wayne dokumentum 1.pdf' },
            { name: 'Wayne dokumentum 2.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2025-12-11 09:15',
          iktatoszam: 'IKT-2025-000988',
          krSzam: 'KR-440311',
          attachments: [
            { name: 'Wayne dokumentum 3.pdf' }
          ]
        },
        {
          description: 'Harmadik eljárási lépés',
          datetime: '2025-12-12 09:15',
          iktatoszam: 'IKT-2025-000989',
          krSzam: 'KR-440312',
          attachments: [
            { name: 'Wayne dokumentum 4.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'insert_drive_file',
      ugyfel: 'Acme',
      description: 'Purchase order',
      datetime: '2026-02-02 11:05',
      unread: true,
      searchKey: 'acme purchase order ikt-2026-000300 kr-450201',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-02-02 11:05',
          iktatoszam: 'IKT-2026-000300',
          krSzam: 'KR-450201',
          attachments: [
            { name: 'Acme PO dokumentum 1.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2026-02-03 11:05',
          iktatoszam: 'IKT-2026-000301',
          krSzam: 'KR-450202',
          attachments: [
            { name: 'Acme PO dokumentum 2.pdf' },
            { name: 'Acme PO dokumentum 3.pdf' }
          ]
        },
        {
          description: 'Harmadik eljárási lépés',
          datetime: '2026-02-04 11:05',
          iktatoszam: 'IKT-2026-000302',
          krSzam: 'KR-450203',
          attachments: [
            { name: 'Acme PO dokumentum 4.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'description',
      ugyfel: 'Initech',
      description: 'Support ticket',
      datetime: '2026-02-01 16:20',
      unread: false,
      searchKey: 'initech support ticket ikt-2026-000400 kr-450301',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-02-01 16:20',
          iktatoszam: 'IKT-2026-000400',
          krSzam: 'KR-450301',
          attachments: [
            { name: 'Initech dokumentum 1.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2026-02-02 16:20',
          iktatoszam: 'IKT-2026-000401',
          krSzam: 'KR-450302',
          attachments: [
            { name: 'Initech dokumentum 2.pdf' }
          ]
        },
        {
          description: 'Harmadik eljárási lépés',
          datetime: '2026-02-03 16:20',
          iktatoszam: 'IKT-2026-000402',
          krSzam: 'KR-450303',
          attachments: [
            { name: 'Initech dokumentum 3.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'description',
      ugyfel: 'Umbrella Corp',
      description: 'Safety report',
      datetime: '2025-11-03 08:30',
      unread: false,
      searchKey: 'umbrella corp safety report ikt-2025-000654 kr-430118',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2025-11-03 08:30',
          iktatoszam: 'IKT-2025-000654',
          krSzam: 'KR-430118',
          attachments: [
            { name: 'Umbrella dokumentum 1.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2025-11-04 08:30',
          iktatoszam: 'IKT-2025-000655',
          krSzam: 'KR-430119',
          attachments: [
            { name: 'Umbrella dokumentum 2.pdf' }
          ]
        },
        {
          description: 'Harmadik eljárási lépés',
          datetime: '2025-11-05 08:30',
          iktatoszam: 'IKT-2025-000656',
          krSzam: 'KR-430120',
          attachments: [
            { name: 'Umbrella dokumentum 3.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'insert_drive_file',
      ugyfel: 'Stark Industries',
      description: 'Tech spec',
      datetime: '2026-01-05 12:00',
      unread: true,
      searchKey: 'stark industries tech spec ikt-2026-000127 kr-450025',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-01-05 12:00',
          iktatoszam: 'IKT-2026-000127',
          krSzam: 'KR-450025',
          attachments: [
            { name: 'Stark dokumentum 1.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2026-01-06 12:00',
          iktatoszam: 'IKT-2026-000128',
          krSzam: 'KR-450026',
          attachments: [
            { name: 'Stark dokumentum 2.pdf' }
          ]
        },
        {
          description: 'Harmadik eljárási lépés',
          datetime: '2026-01-07 12:00',
          iktatoszam: 'IKT-2026-000129',
          krSzam: 'KR-450027',
          attachments: [
            { name: 'Stark dokumentum 3.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'description',
      ugyfel: 'Wayne Enterprises',
      description: 'Board minutes',
      datetime: '2026-01-30 09:45',
      unread: false,
      searchKey: 'wayne enterprises board minutes ikt-2026-000128 kr-450026',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-01-30 09:45',
          iktatoszam: 'IKT-2026-000128',
          krSzam: 'KR-450026',
          attachments: [
            { name: 'Wayne jegyzokonyv 1.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2026-01-31 09:45',
          iktatoszam: 'IKT-2026-000129',
          krSzam: 'KR-450027',
          attachments: [
            { name: 'Wayne jegyzokonyv 2.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'insert_drive_file',
      ugyfel: 'Acme',
      description: 'Invoice #4321',
      datetime: '2026-02-02 09:20',
      unread: true,
      searchKey: 'acme invoice 4321 ikt-2026-000129 kr-450027',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-02-02 09:20',
          iktatoszam: 'IKT-2026-000129',
          krSzam: 'KR-450027',
          attachments: [
            { name: 'Acme szamla 1.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2026-02-03 09:20',
          iktatoszam: 'IKT-2026-000130',
          krSzam: 'KR-450028',
          attachments: [
            { name: 'Acme szamla 2.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'description',
      ugyfel: 'Globex',
      description: 'Contract addendum',
      datetime: '2026-01-15 15:00',
      unread: false,
      searchKey: 'globex contract addendum ikt-2026-000130 kr-450028',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-01-15 15:00',
          iktatoszam: 'IKT-2026-000130',
          krSzam: 'KR-450028',
          attachments: [
            { name: 'Globex addendum 1.pdf' }
          ]
        },
        {
          description: 'Második eljárási lépés',
          datetime: '2026-01-16 15:00',
          iktatoszam: 'IKT-2026-000131',
          krSzam: 'KR-450029',
          attachments: [
            { name: 'Globex addendum 2.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'insert_drive_file',
      ugyfel: 'Initech',
      description: 'Audit log',
      datetime: '2026-01-28 11:10',
      unread: false,
      searchKey: 'initech audit log ikt-2026-000131 kr-450029',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2026-01-28 11:10',
          iktatoszam: 'IKT-2026-000131',
          krSzam: 'KR-450029',
          attachments: [
            { name: 'Initech naplo 1.pdf' }
          ]
        }
      ]
    },
    {
      icon: 'description',
      ugyfel: 'Wayne Enterprises',
      description: 'Legal memo',
      datetime: '2024-06-20 10:00',
      unread: false,
      searchKey: 'wayne enterprises legal memo ikt-2024-000045 kr-410220',
      items: [
        {
          description: 'Első eljárási lépés',
          datetime: '2024-06-20 10:00',
          iktatoszam: 'IKT-2024-000045',
          krSzam: 'KR-410220',
          attachments: [
            { name: 'Wayne legal 1.pdf' },
            { name: 'Wayne legal 2.pdf' }
          ]
        }
      ]
    }
  ];

  getDocuments(): Observable<DocumentItem[]> {
    return of(this.documents);
  }

  searchDocuments(query: string): DocumentItem[] {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    return this.documents.filter(doc => doc.searchKey.includes(q)).slice(0, 8);
  }

}
