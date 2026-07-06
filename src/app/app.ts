import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { AlertService } from './shared/alert.service';
import { IssueSelectionService } from './shared/issue-selection.service';

interface MenuItemEntry {
  text: string;
  level?: number;
}

interface MenuPanelItem {
  title: string;
  items: Array<string | MenuItemEntry>;
}

interface BalanceSubpanelItem {
  title: string;
  items: Array<string | MenuItemEntry>;
}

interface BalancePanelItem {
  title: string;
  items?: Array<string | MenuItemEntry>;
  subpanels?: BalanceSubpanelItem[];
}

type IssueLabel =
  | 'Adóügy'
  | 'Kormányablak'
  | 'Önkormányzat'
  | 'Bűnügy'
  | 'Egészségügy'
  | 'Munkaügy'
  | 'Jog'
  | 'Szolgáltatások';

type IssueCountMap = Record<IssueLabel, number>;

interface UserCounts {
  appointments: number;
  issues: number;
  suspension: number;
  centralHelp: number;
  userSettings: number;
  users: number;
}

interface UserEntry {
  id: string;
  name: string;
  initials: string;
  issueCounts: IssueCountMap;
  counts: UserCounts;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatListModule, MatIconModule, MatButtonModule, MatExpansionModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: '../_styles/app.scss'
})
export class App {
  public readonly alertService = inject(AlertService);
  private readonly issueSelection = inject(IssueSelectionService);
  private readonly router = inject(Router);

  protected getItemText(item: string | { text: string }) {
    return typeof item === 'string' ? item : item.text;
  }

  protected getItemLevel(item: string | { level?: number }) {
    if (typeof item === 'string') {
      return 0;
    }
    return item.level ?? 0;
  }

  protected activePopup: 'settings' | 'contact' | 'balance' | 'appointment' | 'addAppointment' | 'centralHelp' | 'suspension' | 'userSettings' | 'addUser' | 'deleteUser' | 'logoutConfirm' | null = null;
  protected readonly title = signal('e-kozig');
  protected menuBadges = { home: 0, documents: 0, invoices: 0 };
  protected menuBadgeTotal = 0;
  protected readonly isAdmin = true;
  protected showMobileMenu = false;
  protected showUserMenu = false;
  protected userBadgeCount = 1;
  protected readonly contactContent = 'Chat, video, telefon link';
  protected readonly balanceValue = '-200e Ft';
  protected readonly settingsPanels: MenuPanelItem[] = [
    {
      title: 'Adozoi adatok',
      items: ['Adóhatósági igazolások']
    },
    {
      title: 'Foglalkoztatasi adatok',
      items: ['Foglalkoztatói bejelentések, lekérdezések', 'Keresetkimutatás, Járulékadatok']
    },
    {
      title: 'Képviseletek',
      items: [
        { text: 'A képviseleti ügyintézés technikailag működhet, de a gyakorlatban gyakran jelszómegosztásra tolja a feleket. A könyvelő több felületen intéz NAV, ONYA, HIPA vagy adónem-választási ügyet, ezért a vállalkozó sokszor a saját belépését adja át.', level: 0 },
        { text: 'Ez azért baj, mert vita esetén nem lesz ügyféloldalon bizonyítható felelősségi lánc: ki jelentkezett be, ki adott be bevallást, ki módosított jogosultságot, ki kezelte az önkormányzati adót, és miről kapott értesítést a vállalkozó.', level: 0 },
        { text: 'A kívánt működés: a könyvelő saját azonosítással dolgozik, a vállalkozó pedig a saját tárhelyén látja és hagyja jóvá a képviseletet, a HIPA-jogosultságot és az adónemhez kapcsolódó jogosultságokat.', level: 0 },
        { text: 'Lista az aktuális képviseletekről és azok jogosultságairól (törlés gomb a végén)', level: 0 },
        { text: 'Képviselt hozzáadása gomb a könyvelő oldalán', level: 0 },
        { text: 'Képviselet meghatalmazás kérő űrlap betöltése - integrált Onya (jogosultság + önkormányzat - hipa checkbox)', level: 1 },
        { text: 'Könyvelő beküldi a képviseleti meghatalmazás igénylést (kitölti az ürlapot), amit a vállalkozó a saját tárhelyén elfogad', level: 1 },
        { text: 'Könyvelő beküldi a hipa adónem választó ürlapot is a NAV-nak (nem Önkormányzat felületén)', level: 1 },
        { text: 'Így a könyvelő felelőssége is ténylegesen ellenőrizhető: ha a képviseleti jogosultságával hibásan jár el, annak legyen kamarai vagy fegyelmi következménye.', level: 0 },
        { text: 'Miután a saját jogosultságos működés elérhető, a vállalkozó Ügyfélkapu-jelszavának könyvelő általi használata legyen tiltott, naplózható és visszakereshetően szankcionálható.', level: 1 }
      ]
    },
    {
      title: 'Szamlak',
      items: ['Számla kliens regisztráció (m2m/billingo)']
    },
    {
      title: 'Értesítő szabályok',
      items: [
        { text: 'A technikai nyugta a beadónak hasznos, de nem ugyanaz, mint a képviselt vállalkozó érthető tájékoztatása. Ha a könyvelő bead egy bevallást, önellenőrzést vagy jogosultsági kérelmet, az adózónak is látnia kell, hogy az ő nevében milyen ügy indult el.', level: 0 },
        { text: 'Az ügyféloldali hiány az, hogy egy adónem-átsorolás, TB vagy biztosítási státuszváltozás, új bevallás, önellenőrzés vagy adószámla-korrekció már határidőt, pótlékot vagy ellátási jogosultságot érinthet, miközben az adózó csak utólag érti meg, mi történt.', level: 0 },
        { text: 'Ezért a vállalkozónak rövid, emberi nyelvű tárhelyes értesítést kell kapnia: mi változott, ki indította, melyik időszakot érinti, hol nézhető meg a részlet, és kell-e jóváhagynia.', level: 0 },
        { text: 'Beállítható események:', level: 0 },
        { text: 'Mely képviseleti műveletekről szeretne értesítést a vállalkozó a tárhelyén (e-mail)', level: 1 },
        { text: 'Mely képviseleti műveleteket szeretné el is fogadni a tárhelyén (e-mail), mielőtt aktiválódik (30 nap múlva automatikusan elfogadasra kerül)', level: 1 },
        { text: 'Kritikus értesítési események:', level: 0 },
        { text: 'automatikus adónem-átsorolás vagy adózási státusz változás', level: 1 },
        { text: 'jogosultsági, biztosítási vagy minimum TB fizetési helyzet változása', level: 1 },
        { text: 'új bevallás vagy önellenőrzés benyújtása a vállalkozó nevében', level: 1 },
        { text: 'adószámla-változás, különösen ha lezárt időszakot vagy visszamenőleges korrekciót érint', level: 1 },
        { text: 'A tárhelyre érkező üzenet formája, amikor A könyvelő benyújtja az adóbevallást és a NAV feldolgozza azt:', level: 0 },
        { text: 'A könyvelőnek visszaküld egy technikai vagy hibaüzenetet a szokásos módon', level: 1 },
        { text: 'A vállalkozónak rövid, közérthető tájékoztatást küld', level: 1 },
        { text: '„A 2021-es KATA adóbevallásban hibát észleltünk, itt tekintheti meg.”', level: 2 },
        { text: '„Az Ön nevében új adóbevallás került benyújtásra. Kérjük, tekintse át az Ügyfélportál [megadott menüpontjában]. Ha mindent rendben talál, fogadja el; ha nem reagál 30 napon belül, a bevallást automatikusan elfogadottnak tekintjük.”', level: 2 },
        { text: '„Az adóbevallás sikeresen benyújtásra került.”', level: 2 }
      ]
    },
    {
      title: 'Adatvédelem és audit',
      items: [
        { text: 'A több rendszer önmagában nem probléma. A gond akkor keletkezik, ha a DÁP, NAV, ONYA és jogosultsági felületek eseményei az adózó oldalán nem állnak össze egy bizonyítható, időrendi ügytörténetté.', level: 0 },
        { text: 'Ha később vita van egy bevallásról, képviseletről, vállalkozás-szüneteltetésről vagy adószámla-változásról, akkor nem elég egy belső technikai napló. Az adózónak is látnia kell: ki indította, milyen jogosultsággal, mikor, milyen adatra hivatkozva, és kapott-e róla értesítést.', level: 0 },
        { text: 'Ezért minden képviseleti, bevallási, jogosultsági és adószámla-módosító művelethez ügyfél által olvasható eseménynapló kell, amely később bizonyítékként is értelmezhető.', level: 0 },
        { text: 'A DÁP/NAV azonosítás és jogosultságkezelés legyen közös logikára fűzve, hogy az adatkezelés ne széttöredezett felületeken történjen.', level: 1 }
      ]
    },
    {
      title: 'Minőségbiztosítás',
      items: [
        { text: 'Probléma:', level: 0 },
        { text: 'Az állami informatikai rendszerek sokszor zárt fejlesztésben készülnek, ezért a tervezési és programozási hibák csak éles ügyintézés közben derülnek ki. Ilyenkor a felhasználó lesz a tesztalany a saját kárán.', level: 1 },
        { text: 'NAV-ügyben ez azért különösen súlyos, mert egy IT-hiba is határidőt, pótlékot, hibás bevallást vagy bizonyíthatatlan ügytörténetet okozhat, miközben a következmény az adózónál jelenik meg.', level: 1 },
        { text: 'Konkrét példa az Ügyfélportál Dokumentumok része: ügyszám, iktatószám, nyugta, tárhelynapló, szerveroldali hibaüzenet és generált dokumentum nem mindig áll össze egy ellenőrizhető ügyidővonallá.', level: 1 },
        { text: 'Javaslat:', level: 0 },
        { text: 'A NAV-nak és más állami szervnek a saját IT-hibáit soron kívül el kell ismernie és javítania kell; informatikai hibánál ne az ügyfél viselje a rendszerhiba következményét.', level: 1 },
        { text: 'Legyen szervezetektől független IT-minőségbiztosító szakmai csapat, amely állami informatikai projekteket tesztel, felhasználói hibajelzéseket fogad, tervezési hibákra javítást javasol, és a költségek arányosságát is ellenőrizheti.', level: 1 },
        { text: 'A NAV-rendszerek DÁP / Ügyfélportál felületbe integrált prototípusa ezt szolgálja: élesítés előtt lehessen kipróbálni, javítani és szakmai vitára bocsátani a folyamatot.', level: 1 }
      ]
    }
  ];
  protected readonly balancePanels: BalancePanelItem[] = [
    {
      title: 'Befizetés',
      items: [
        { text: 'A befizetési rendszer működhet számviteli szempontból, mégis nehéz az adózónak: több adónem, alszámla, előleg, járulék és önkormányzati tétel között kell eldöntenie, pontosan hova menjen a pénz.', level: 0 },
        { text: 'A konkrét kockázat az, hogy az adózó fizetett, de rossz alszámlára, rossz jogcímre vagy később átvezetendő tételre. Ilyenkor a saját oldalán tartozást lát, miközben nem fizetési szándék hiányzott, hanem egyértelmű fizetési útmutató.', level: 0 },
        { text: 'Ezért egy adószámlára történjen a befizetés: az adózó ellenőrzi és jóváhagyja a NAV által kiajánlott bevallást és fizetési tervet, a NAV pedig a befizetést szétosztja a jogcímek között.', level: 0 },
        { text: 'A különböző jogcímek ne külön adózói találgatást igényeljenek, hanem a NAV-oldali szétosztásban jelenjenek meg.', level: 0 },
        { text: '"Természetes Személy" (Egyéni vállalkozó, Munkanélküli stb.)', level: 1 },
        { text: 'Ha egy utalás az egy adószámlára érkezik, azt a NAV automatikusan felosztja a megfelelő jogcímek között. (pl. egészségügyi járulék, nyugdíjjárulék, kamarai hozzájárulás, HIPA stb.).', level: 2 },
        { text: '"Vállalkozás" (Kft, Bt...)', level: 1 },
        { text: 'Adózási formák', level: 0 },
        { text: 'Számlaalapú progresszív adózás: a NAV a számlák alapján kiajánlja a bevallást és a fizetendő adót; a progresszív adókulcs 9-35% között mozoghat.', level: 1 },
        { text: 'Alap számlaalapú adózás: a kiállított számlák után számolt progresszív adó és járulék.', level: 2 },
        { text: 'Átalányadó: ugyanennek költséghányados változata, ahol a NAV a bevételből levonja a költséghányadot.', level: 2 },
        { text: 'VSZJA: tételes, költségszámlás elszámolás, ahol a bejövő számlákat automatikusan, később AI-alapon kell kategorizálni.', level: 2 },
        { text: 'Kényszervállalkozásnál a dolgozó befizetheti az alkalmazotti terheknek megfelelő adót és járulékot, így az ő oldala rendezett; a NAV a foglalkoztatót ellenőrzi a be nem jelentett munkaviszony és a meg nem fizetett munkáltatói bérjárulék miatt.', level: 2 },
        { text: 'Közös számlaalapú szabályok:', level: 1 },
        { text: 'Külföldi távmunka számláinál a számla kelte szerinti MNB középárfolyam legyen az adóalap számításának alapja.', level: 2 },
        { text: 'A számlakiállítás 90 napon belüli legyen, hogy a számla a valós teljesítéshez és adózási időszakhoz rendezhető legyen.', level: 2 },
        { text: 'Közös elemek:', level: 1 },
        { text: 'Alanyi adómentes határ', level: 2 },
        { text: 'Minimum a minimálbér utáni járulékfizetés (garantált bérminimum eltörlése)', level: 2 },
        { text: 'Adókulcsot csökkentő tételek (pl. családi kedvezmény)', level: 2 },
        { text: 'Adó-visszaigénylési lehetőség (pl. ha az éves jövedelem nem éri el a minimálbér összegét)', level: 2 },
        { text: 'A cél az adózási torzítás csökkentése: aki dolgozik és fizetni akar, annak legyen rendezett befizetési útja akkor is, ha a másik fél a foglalkoztatási kötelezettségét nem teljesíti.', level: 2 }
      ]
    },
    {
      title: 'Bevezetés és tesztelés',
      items: [
        { text: 'Egy új adózási vagy NAV/DÁP folyamat papíron és technikailag is lehet működő, mégis csak valós használatban derül ki, hogy az adózó, könyvelő, NAV-ügyintéző, nyomtatvány és fizetési folyamat ugyanúgy értelmezi-e.', level: 0 },
        { text: 'A kockázat nem az, hogy minden újítás rossz, hanem az, hogy teljes kötelező átállásnál az első gyakorlati értelmezési hibák már pótlékként, rossz bevallásként vagy elveszett határidőként az ügyfélnél jelennek meg.', level: 0 },
        { text: 'Ezért az új adózási vagy NAV/DÁP folyamat először választhatóan, a régi mellett fusson. Így mérhető, hol nem egyértelmű az ügyféloldali út, mielőtt a régi folyamat végleg kivezetésre kerül.', level: 0 },
        { text: 'Példa ütemezés: szeptemberben választható indulás, januárban a régi folyamat kivezetése a tapasztalatok alapján.', level: 1 },
        { text: 'Az átmeneti időszakhoz kapcsolódhat promóciós, csökkentett adókulcs, hogy a vállalkozók önként kipróbálják az új rendszert.', level: 1 },
        { text: 'A kedvezmény ne kivételezés legyen, hanem nyilvános tesztelési ösztönző: aki vállalja az új folyamatot, visszajelzést ad és segít finomhangolni.', level: 2 },
        { text: 'Nem valós vészhelyzeti adóváltozásnál legalább 3 hónap felkészülési idő kellene a hatálybalépésig.', level: 1 },
        { text: 'Ha a kormány korábban is bevezethette volna a módosítást, legyen legalább 6 hónapos átmeneti időszak a közlöny megjelenésétől.', level: 1 },
        { text: 'A fő kockázat nem a képernyőterv, hanem az, hogy a szabály, a felület, a könyvelői gyakorlat és a NAV háttérfolyamat eltérően értelmezheti ugyanazt a helyzetet.', level: 1 },
        { text: 'Hirtelen, visszamenőleges vagy néhány napos alkalmazkodási idejű átállás helyett legyen kötelező próbaidőszak és visszajelzési kör, dokumentált javítási listával.', level: 1 }
      ]
    },
    {
      title: 'Adónaptár',
      items: [
        'Esedékes bevallások',
        'Hiányzó bevallások'
      ]
    },
    {
      title: 'Köztartozások',
      subpanels: [
        {
          title: 'Fizetési tájékoztatók',
          items: [
            { text: 'Az adószámla hatósági nyilvántartásként működhet, de az adózónak fizetéskor nem könyvelési logikára, hanem egy lezárható fizetési kötelezettségre van szüksége: mennyi, milyen jogcímen, melyik időszakra, meddig és milyen azonosítóval fizetendő.', level: 0 },
            { text: 'Itt nem a későbbi NAV-oldali javítás lehetőségét kell megszüntetni. A lényeg az, hogy az adózó oldalán a múlt ne úgy változzon meg, mintha egy korábban határidőre teljesített fizetés akkor sem lett volna rendezett.', level: 0 },
            { text: 'A javaslat szerint a NAV közüzemi számlához hasonló fizetési értesítőt állítana ki. Ha az adózó ezt határidőre befizeti, az adott értesítő ügyféloldalon lezárt teljesítés marad.', level: 1 },
            { text: 'Későbbi NAV-oldali vagy bevallási korrekció továbbra is kezelhető, de külön elszámoló vagy helyesbítő tételként jelenjen meg, saját magyarázattal és saját határidővel. Így látszik, mi volt eredetileg teljesítve, és mi az új korrekció.', level: 1 }
          ]
        },
        {
          title: 'Pótléklevezetés',
          items: [
            'Késedelmi pótlékok részletezése időszakonként',
            'Pótlék csak az eredeti határidő és a látható korrekciós tétel alapján keletkezzen'
          ]
        },
        {
          title: 'Adóteljesítmény',
          items: [
            'Befizetések és teljesítések kimutatása'
          ]
        },
        {
          title: 'Köztartozásmentes adózói adatbázis (KOMA)',
          items: ['KOMA státusz és előzmények']
        },
        {
          title: 'Egyéb végrehajtható köztartozások',
          items: ['Más hatóságoktól átvett végrehajtható tartozások']
        }
      ]
    },
    {
      title: 'Adóraktár',
      subpanels: [
        {
          title: 'Adóraktári készlet + mozgás',
          items: ['Készletállomány és készletmozgások listája']
        },
        {
          title: 'Jövedéki biztosíték szabad keret',
          items: ['Aktuális biztosítékkeret és felhasználás']
        }
      ]
    }
  ];
  protected readonly users: UserEntry[] = [
    {
      id: 'user-1',
      name: 'Farkas Anna',
      initials: 'FA',
      issueCounts: {
        'Adóügy': 2,
        'Kormányablak': 1,
        'Önkormányzat': 0,
        'Bűnügy': 3,
        'Egészségügy': 2,
        'Munkaügy': 1,
        'Jog': 4,
        'Szolgáltatások': 2
      } as IssueCountMap,
      counts: {
        appointments: 3,
        issues: 15,
        suspension: 1,
        centralHelp: 2,
        userSettings: 1,
        users: 4
      }
    },
    {
      id: 'user-2',
      name: 'Kiss Balázs',
      initials: 'KB',
      issueCounts: {
        'Adóügy': 1,
        'Kormányablak': 0,
        'Önkormányzat': 1,
        'Bűnügy': 0,
        'Egészségügy': 1,
        'Munkaügy': 0,
        'Jog': 2,
        'Szolgáltatások': 0
      } as IssueCountMap,
      counts: {
        appointments: 2,
        issues: 5,
        suspension: 0,
        centralHelp: 1,
        userSettings: 1,
        users: 4
      }
    },
    {
      id: 'user-3',
      name: 'Nagy Eszter',
      initials: 'NE',
      issueCounts: {
        'Adóügy': 3,
        'Kormányablak': 2,
        'Önkormányzat': 1,
        'Bűnügy': 2,
        'Egészségügy': 0,
        'Munkaügy': 1,
        'Jog': 1,
        'Szolgáltatások': 3
      } as IssueCountMap,
      counts: {
        appointments: 4,
        issues: 13,
        suspension: 2,
        centralHelp: 1,
        userSettings: 1,
        users: 4
      }
    }
  ];
  protected activeUserId = 'user-1';

  protected readonly appointmentsByUser: Record<string, Array<{
    id: string;
    place: string;
    address: string;
    datetime: string;
    mapUrl: string;
  }>> = {
    'user-1': [
      {
        id: 'app-1',
        place: 'NAV Kiemelt Ügyfélszolgálat',
        address: '1054 Budapest, Széchenyi u. 2.',
        datetime: '2026.02.18. 10:30',
        mapUrl: 'https://maps.google.com/?q=1054+Budapest+Sz%C3%A9chenyi+u.+2'
      },
      {
        id: 'app-2',
        place: 'Kormányablak - XIII. kerület',
        address: '1133 Budapest, Váci út 62-64.',
        datetime: '2026.02.26. 09:15',
        mapUrl: 'https://maps.google.com/?q=1133+Budapest+V%C3%A1ci+%C3%BAt+62-64'
      },
      {
        id: 'app-3',
        place: 'Önkormányzat - Ügyféltér',
        address: '1146 Budapest, Thököly út 11.',
        datetime: '2026.03.05. 14:00',
        mapUrl: 'https://maps.google.com/?q=1146+Budapest+Th%C3%B6k%C3%B6ly+%C3%BAt+11'
      }
    ],
    'user-2': [
      {
        id: 'app-4',
        place: 'Kormányablak - XVI. kerület',
        address: '1163 Budapest, Veres Péter út 112.',
        datetime: '2026.02.20. 08:45',
        mapUrl: 'https://maps.google.com/?q=1163+Budapest+Veres+P%C3%A9ter+%C3%BAt+112'
      },
      {
        id: 'app-5',
        place: 'NAV Ügyfélszolgálat',
        address: '1081 Budapest, József körút 18.',
        datetime: '2026.02.27. 11:00',
        mapUrl: 'https://maps.google.com/?q=1081+Budapest+J%C3%B3zsef+k%C3%B6r%C3%BAt+18'
      }
    ],
    'user-3': [
      {
        id: 'app-6',
        place: 'Önkormányzat - Ügyféltér',
        address: '1123 Budapest, Alkotás u. 1.',
        datetime: '2026.02.19. 13:20',
        mapUrl: 'https://maps.google.com/?q=1123+Budapest+Alkot%C3%A1s+u.+1'
      },
      {
        id: 'app-7',
        place: 'Kormányablak - XI. kerület',
        address: '1117 Budapest, Fehérvári út 52.',
        datetime: '2026.02.25. 09:00',
        mapUrl: 'https://maps.google.com/?q=1117+Budapest+Feh%C3%A9rv%C3%A1ri+%C3%BAt+52'
      },
      {
        id: 'app-8',
        place: 'NAV Kiemelt Ügyfélszolgálat',
        address: '1054 Budapest, Széchenyi u. 2.',
        datetime: '2026.03.03. 15:10',
        mapUrl: 'https://maps.google.com/?q=1054+Budapest+Sz%C3%A9chenyi+u.+2'
      },
      {
        id: 'app-9',
        place: 'Egészségügyi Központ',
        address: '1037 Budapest, Bécsi út 96.',
        datetime: '2026.03.10. 10:00',
        mapUrl: 'https://maps.google.com/?q=1037+Budapest+B%C3%A9csi+%C3%BAt+96'
      }
    ]
  };

  protected selectedAppointmentId = this.appointmentsByUser['user-1'][0].id;
  protected readonly appointmentCategories = [
    'Adóügy',
    'Kormányablak',
    'Önkormányzat',
    'Bűnügy',
    'Egészségügy',
    'Munkaügy',
    'Jog',
    'Szolgáltatások'
  ];
  protected selectedAppointmentCategory = this.appointmentCategories[0];
  protected clickedUserId: string | null = null;
  private clickedUserTimer: ReturnType<typeof setTimeout> | null = null;
  protected pendingDeleteUser: UserEntry | null = null;

  protected readonly issueGroups: Array<{ label: IssueLabel; detail: string }> = [
    { label: 'Adóügy', detail: 'NAV' },
    { label: 'Kormányablak', detail: 'Okmány stb.' },
    { label: 'Önkormányzat', detail: 'Helyi ügyek' },
    { label: 'Bűnügy', detail: 'Rendőrség' },
    { label: 'Egészségügy', detail: 'EESZT' },
    { label: 'Munkaügy', detail: 'Munkaügyi Központ' },
    { label: 'Jog', detail: 'Bíróság, Ügyészség, Fogyasztóvédelem, Igazságügy, Köztársasági Elnök' },
    { label: 'Szolgáltatások', detail: 'Közüzemi számlák, BKV bérletek, autópálya matrica, parkolás' }
  ];
  protected issueQuery = '';
  protected usersOpen = true;
  protected appointmentsOpen = false;
  protected issuesOpen = false;
  protected selectedIssueLabel: IssueLabel = 'Adóügy';
  protected userMenuView: 'root' | 'users' = 'root';
  protected readonly issueLogoMap: Record<IssueLabel, string> = {
    'Adóügy': 'adougy-logo.svg',
    'Kormányablak': 'kormanyablak-logo.svg',
    'Önkormányzat': 'onkormanyzat-logo.svg',
    'Bűnügy': 'bunugy-logo.svg',
    'Egészségügy': 'egeszsegugy-logo.svg',
    'Munkaügy': 'munkauegy-logo.svg',
    'Jog': 'jog-logo.svg',
    'Szolgáltatások': 'szolgaltatasok-logo.svg'
  };
  protected readonly userColorClassMap: Record<string, string> = {
    'user-1': 'user-color-1',
    'user-2': 'user-color-2',
    'user-3': 'user-color-3'
  };

  constructor() {
    this.userBadgeCount = this.getUserMenuTotal();
    this.selectIssue('Adóügy');
    // Listen for menu toggle events from child components
    window.addEventListener('toggleMobileMenu', () => {
      this.toggleMobileMenu();
    });
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  openPopup(type: 'settings' | 'contact' | 'balance') {
    this.activePopup = type;
    this.showMobileMenu = false;
  }

  openUserPopup(type: 'appointment' | 'addAppointment' | 'centralHelp' | 'suspension' | 'userSettings' | 'addUser' | 'deleteUser' | 'logoutConfirm', user?: UserEntry) {
    if (type === 'deleteUser' || type === 'suspension') {
      this.pendingDeleteUser = user ?? null;
    }
    this.activePopup = type;
    this.showUserMenu = false;
  }

  closePopup() {
    this.activePopup = null;
    this.pendingDeleteUser = null;
  }

  getPopupTitle() {
    switch (this.activePopup) {
      case 'settings':
        return 'Beállítások';
      case 'contact':
        return 'Kapcsolat';
      case 'balance':
        return 'Egyenleg';
      case 'appointment':
        return 'Időpontfoglalás';
      case 'addAppointment':
        return 'Új időpontfoglalás';
      case 'centralHelp':
        return 'Központi segítség';
      case 'suspension':
        return 'Felhasználó Felfüggesztése';
      case 'userSettings':
        return 'Beállítások';
      case 'addUser':
        return 'Felhasználó hozzáadása';
      case 'deleteUser':
        return 'Törlés';
      case 'logoutConfirm':
        return 'Kilépés';
      default:
        return '';
    }
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu() {
    this.showUserMenu = false;
    this.userMenuView = 'root';
  }

  openUserMenuView(view: 'root' | 'users') {
    this.userMenuView = view;
    if (view === 'users') {
      this.usersOpen = true;
    }
  }

  toggleUserSection(section: 'users' | 'appointments') {
    if (section === 'users') {
      this.usersOpen = !this.usersOpen;
      return;
    }
    this.appointmentsOpen = !this.appointmentsOpen;
    if (this.appointmentsOpen) {
      this.issuesOpen = false;
    }
  }


  toggleIssueSection() {
    this.issuesOpen = !this.issuesOpen;
    if (this.issuesOpen) {
      this.appointmentsOpen = false;
    }
  }

  getIssueTotal() {
    return Object.values(this.activeUser.issueCounts ?? {}).reduce((sum, value) => sum + value, 0);
  }

  getIssueCount(label: IssueLabel) {
    return this.activeUser.issueCounts?.[label] ?? 0;
  }

  onUserSelect() {
    this.toggleUserMenu();
  }

  get activeUser() {
    return this.users.find(user => user.id === this.activeUserId) ?? this.users[0];
  }

  get otherUsers() {
    return this.users.filter(user => user.id !== this.activeUserId);
  }

  selectUser(userId: string) {
    this.activeUserId = userId;
    this.clickedUserId = userId;
    if (this.clickedUserTimer) {
      clearTimeout(this.clickedUserTimer);
    }
    this.clickedUserTimer = setTimeout(() => {
      this.clickedUserId = null;
      this.clickedUserTimer = null;
    }, 450);
    this.userBadgeCount = this.getUserMenuTotal();
    this.selectIssue('Adóügy');
    const firstAppointment = this.userAppointments[0];
    if (firstAppointment) {
      this.selectedAppointmentId = firstAppointment.id;
    }
  }

  getUserMenuTotal() {
    return this.getUserMenuTotalFor(this.activeUser);
  }

  getUserMenuTotalFor(user: { id: string; counts: UserCounts; issueCounts?: IssueCountMap }) {
    const issueTotal = Object.values(user.issueCounts ?? {}).reduce((sum, value) => sum + value, 0);
    const appointmentTotal = this.appointmentsByUser[user.id]?.length ?? user.counts.appointments;
    return appointmentTotal + issueTotal;
  }

  getUserMenuCount(key: keyof typeof this.activeUser.counts) {
    if (key === 'issues') {
      return this.getIssueTotal();
    }
    return this.activeUser.counts[key] ?? 0;
  }

  selectAppointment(appointmentId: string) {
    this.selectedAppointmentId = appointmentId;
    this.selectedAppointmentCategory = this.getCategoryForAppointment();
  }

  get userAppointments() {
    return this.appointmentsByUser[this.activeUserId] ?? [];
  }

  get selectedAppointment() {
    const appointments = this.userAppointments;
    return appointments.find(item => item.id === this.selectedAppointmentId) ?? appointments[0];
  }

  private getCategoryForAppointment() {
    const place = this.selectedAppointment.place.toLowerCase();
    if (place.includes('nav')) {
      return 'Adóügy';
    }
    if (place.includes('kormányablak')) {
      return 'Kormányablak';
    }
    if (place.includes('önkormányzat')) {
      return 'Önkormányzat';
    }
    return this.appointmentCategories[0];
  }

  setAppointmentCategory(category: string) {
    this.selectedAppointmentCategory = category;
  }

  onIssueQueryChange(value: string) {
    this.issueQuery = value;
    const match = this.issueGroups.find(item => item.label.toLowerCase() === value.toLowerCase());
    if (match) {
      this.selectIssue(match.label);
    }
  }

  selectIssue(issue: IssueLabel) {
    this.selectedIssueLabel = issue;
    const detail = this.getIssueDetail(issue);
    this.issueSelection.setIssue(issue, detail);
    this.updateMenuBadgesForIssue(issue);
    this.router.navigate(['/home']);
  }

  getIssueDetail(issue: IssueLabel) {
    return this.issueGroups.find(item => item.label === issue)?.detail ?? '';
  }

  getIssueRowClass(issue: IssueLabel) {
    switch (issue) {
      case 'Adóügy':
        return 'issue-row--nav';
      case 'Kormányablak':
        return 'issue-row--kormanyablak';
      case 'Önkormányzat':
        return 'issue-row--onkormanyzat';
      case 'Bűnügy':
        return 'issue-row--bunugy';
      case 'Egészségügy':
        return 'issue-row--egeszsegugy';
      case 'Munkaügy':
        return 'issue-row--munkauegy';
      case 'Jog':
        return 'issue-row--jog';
      case 'Szolgáltatások':
        return 'issue-row--szolgaltatasok';
      default:
        return '';
    }
  }

  getIssueLogo() {
    const file = this.issueLogoMap[this.selectedIssueLabel] ?? 'adougy-logo.svg';
    return `assets/img/${file}`;
  }

  getUserColorClass(userId: string) {
    return this.userColorClassMap[userId] ?? 'user-color-1';
  }

  private updateMenuBadgesForIssue(issue: IssueLabel) {
    const count = this.getIssueCount(issue);
    if (issue === 'Adóügy') {
      const base = Math.floor(count / 3);
      const remainder = count % 3;
      this.menuBadges = {
        home: base + (remainder > 0 ? 1 : 0),
        documents: base + (remainder > 1 ? 1 : 0),
        invoices: base
      };
    } else {
      this.menuBadges = {
        home: count,
        documents: 0,
        invoices: 0
      };
    }
    this.menuBadgeTotal = count;
  }

  openMapLink(url: string, openNewTab: boolean) {
    if (openNewTab) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    window.location.href = url;
  }

  openMapLinkSmart(url: string) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.openMapLink(url, !isMobile);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showMobileMenu && !target.closest('.mobile-menu-panel-global') && !target.closest('.mobile-menu-btn-global')) {
      this.showMobileMenu = false;
    }
    if (this.showUserMenu && !target.closest('.user-menu-panel') && !target.closest('.user-selector-btn-global')) {
      this.showUserMenu = false;
    }
  }
}
