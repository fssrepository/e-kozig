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
  protected readonly contactContent = 'Csevegés, videóhívás és telefonos kapcsolat';
  protected readonly balanceValue = '-200 000 Ft';
  protected readonly settingsPanels: MenuPanelItem[] = [
    {
      title: 'Adózói adatok',
      items: ['Adóhatósági igazolások']
    },
    {
      title: 'Foglalkoztatási adatok',
      items: ['Foglalkoztatói bejelentések és lekérdezések', 'Keresetkimutatás és járulékadatok']
    },
    {
      title: 'Képviseletek',
      items: [
        { text: 'A képviseleti ügyintézés gyakran jelszómegosztáshoz vezet, mert a könyvelő több NAV-, ONYA-, HIPA- és adónem-választási felületet használ.', level: 0 },
        { text: 'Jelszómegosztáskor vita esetén nem bizonyítható, ki jelentkezett be, nyújtott be bevallást, módosított jogosultságot vagy kezelt önkormányzati adót, és miről értesült a vállalkozó.', level: 0 },
        { text: 'A könyvelő saját azonosítással járjon el; a vállalkozó a tárhelyén tekinthesse át és hagyhassa jóvá a képviseletet, valamint a HIPA-hoz és az egyes adónemekhez kapcsolódó jogosultságokat.', level: 0 },
        { text: 'Az aktuális képviseletek és jogosultságaik listája, törlési lehetőséggel.', level: 0 },
        { text: 'Új képviselet hozzáadása a könyvelői felületen.', level: 0 },
        { text: 'Meghatalmazási űrlap betöltése az ONYA-ból, önkormányzati és HIPA-jogosultságokkal.', level: 1 },
        { text: 'A könyvelő benyújtja a meghatalmazási kérelmet, a vállalkozó pedig a tárhelyén jóváhagyja.', level: 1 },
        { text: 'A HIPA-adónem választására szolgáló űrlapot a könyvelő az ONYA-ban, a NAV-hoz nyújtja be, nem az önkormányzati felületen.', level: 1 },
        { text: 'A saját azonosítással végzett műveletek ellenőrizhetők, a hibás eljárás pedig kamarai vagy fegyelmi következménnyel járhat.', level: 0 },
        { text: 'Ha a saját jogosultságú ügyintézés elérhető, a könyvelő ne használhassa a vállalkozó Ügyfélkapu-jelszavát; a visszaélés legyen naplózható, visszakereshető és szankcionálható.', level: 1 }
      ]
    },
    {
      title: 'Számlák',
      items: ['Számlázóprogram regisztrációja (M2M/Billingo)']
    },
    {
      title: 'Értesítő szabályok',
      items: [
        { text: 'A technikai nyugta nem helyettesíti a képviselt vállalkozó közérthető tájékoztatását: lássa, milyen bevallást, önellenőrzést vagy jogosultsági kérelmet nyújtottak be a nevében.', level: 0 },
        { text: 'Az adónem, a biztosítási jogviszony, a bevallás vagy az adószámla változása határidőt, pótlékot vagy ellátási jogosultságot érinthet.', level: 0 },
        { text: 'A tárhelyre küldött értesítés közölje röviden, mi változott, ki indította, mely időszakot érinti, hol találhatók a részletek, és szükséges-e jóváhagyás.', level: 0 },
        { text: 'Beállítható események:', level: 0 },
        { text: 'Értesítés a kiválasztott képviseleti műveletekről a tárhelyen és e-mailben.', level: 1 },
        { text: 'Jóváhagyás kérése a kiválasztott műveletek aktiválása előtt; válasz nélkül 30 nap után automatikus elfogadás.', level: 1 },
        { text: 'Kritikus értesítési események:', level: 0 },
        { text: 'automatikus adónem-átsorolás vagy az adózási státusz változása', level: 1 },
        { text: 'jogosultság, biztosítási jogviszony vagy minimális járulékfizetési kötelezettség változása', level: 1 },
        { text: 'új bevallás vagy önellenőrzés benyújtása a vállalkozó nevében', level: 1 },
        { text: 'adószámla-változás, különösen lezárt időszakot érintő vagy visszamenőleges korrekció esetén', level: 1 },
        { text: 'Példák a tárhelyre küldött értesítésekre a könyvelő által benyújtott bevallás feldolgozásakor:', level: 0 },
        { text: 'A könyvelő a megszokott technikai vagy hibaüzenetet kapja.', level: 1 },
        { text: 'A vállalkozó rövid, közérthető tájékoztatást kap.', level: 1 },
        { text: '„Hibát találtunk a 2021-es kata-bevallásban. A részleteket itt tekintheti meg.”', level: 2 },
        { text: '„Új adóbevallást nyújtottak be az Ön nevében. Tekintse át az Ügyfélportál [megadott menüpontjában], majd fogadja el. Ha 30 napon belül nem válaszol, automatikusan elfogadottnak tekintjük.”', level: 2 },
        { text: '„Az adóbevallást sikeresen benyújtották.”', level: 2 }
      ]
    },
    {
      title: 'Adatvédelem és audit',
      items: [
        { text: 'A DÁP, a NAV, az ONYA és a jogosultsági felületek eseményei alkossanak időrendi, bizonyítható ügytörténetet.', level: 0 },
        { text: 'Bevallási, képviseleti, szüneteltetési vagy adószámla-vita esetén a belső műszaki napló nem elég: az adózó is lássa, ki, mikor, milyen jogosultsággal és adatok alapján indított műveletet, és kapott-e róla értesítést.', level: 0 },
        { text: 'Minden képviseleti, bevallási, jogosultsági és adószámla-művelet kerüljön az ügyfél számára is olvasható, bizonyítékként használható eseménynaplóba.', level: 0 },
        { text: 'A DÁP és a NAV azonosítása és jogosultságkezelése egységesen működjön, hogy az adatkezelés ne töredezzen szét.', level: 1 }
      ]
    },
    {
      title: 'Minőségbiztosítás',
      items: [
        { text: 'Probléma:', level: 0 },
        { text: 'A zárt fejlesztésű állami informatikai rendszerek hibái gyakran csak éles használatkor derülnek ki.', level: 1 },
        { text: 'NAV-ügyben egy informatikai hiba határidőmulasztást, pótlékot, hibás bevallást vagy hiányos ügytörténetet okozhat, következménye pedig az adózót terhelheti.', level: 1 },
        { text: 'Az Ügyfélportál Dokumentumok nézetében az ügyszám, iktatószám, nyugta, tárhelynapló, hibaüzenet és dokumentum nem mindig kapcsolódik egyértelmű ügytörténethez.', level: 1 },
        { text: 'Javaslat:', level: 0 },
        { text: 'Az állami szervek ismerjék el és soron kívül javítsák informatikai hibáikat; azok következményeit ne az ügyfél viselje.', level: 1 },
        { text: 'Független szakmai csapat tesztelje az állami informatikai projekteket, fogadja a hibajelzéseket, javasoljon javításokat, és vizsgálhassa a költségek arányosságát.', level: 1 },
        { text: 'A DÁP-ba integrált, NAV-folyamatokat bemutató prototípus lehetőséget ad az élesítés előtti tesztelésre, javításra és szakmai vitára.', level: 1 }
      ]
    }
  ];
  protected readonly balancePanels: BalancePanelItem[] = [
    {
      title: 'Befizetés',
      items: [
        { text: 'Az adózónak több adónem és alszámla között kell kiválasztania a befizetés helyét.', level: 0 },
        { text: 'Az adózó fizetés után is tartozást láthat, ha rossz alszámlára vagy jogcímre utalt.', level: 0 },
        { text: 'A befizetés egyetlen adószámlára érkezzen; az adózó hagyja jóvá a NAV bevallási és fizetési javaslatát, a NAV pedig ossza szét az összeget.', level: 0 },
        { text: 'Az adózónak ne kelljen jogcímenként külön számlát választania.', level: 0 },
        { text: 'Természetes személy (például egyéni vállalkozó vagy álláskereső)', level: 1 },
        { text: 'A NAV az egyetlen adószámlára érkező utalást automatikusan ossza fel a jogcímek – például egészségügyi szolgáltatási járulék, nyugdíjjárulék, kamarai hozzájárulás vagy HIPA – között.', level: 2 },
        { text: 'Vállalkozás (például kft. vagy bt.)', level: 1 },
        { text: 'Adózási formák', level: 0 },
        { text: 'Számlaalapú progresszív adózás: a NAV a számlák alapján kiajánlja a bevallást és a fizetendő adót; az adókulcs 9–35% között mozoghat.', level: 1 },
        { text: 'Alap számlaalapú adózás: progresszív adó és járulék a kiállított számlák alapján.', level: 2 },
        { text: 'Átalányadó: a NAV a bevételből levonja a költséghányadot.', level: 2 },
        { text: 'VSZJA: tételes, költségszámlás elszámolás, a bejövő számlák automatikus, később mesterséges intelligencián alapuló kategorizálásával.', level: 2 },
        { text: 'Kényszervállalkozásnál a dolgozó befizetheti az alkalmazotti terheknek megfelelő adót és járulékot. A NAV a foglalkoztatót ellenőrzi a be nem jelentett munkaviszony és az elmaradt munkáltatói járulékok miatt.', level: 2 },
        { text: 'Közös számlaalapú szabályok:', level: 1 },
        { text: 'A külföldi távmunka számláinál a számla keltekor érvényes MNB-középárfolyam alapján számítsák az adóalapot.', level: 2 },
        { text: 'A számlát 90 napon belül kelljen kiállítani, hogy a valós teljesítéshez és a megfelelő adózási időszakhoz legyen rendelhető.', level: 2 },
        { text: 'Közös elemek:', level: 1 },
        { text: 'Az alanyi adómentesség értékhatára', level: 2 },
        { text: 'Legalább a minimálbér alapján számított járulékfizetés; a garantált bérminimum megszüntetése', level: 2 },
        { text: 'Az adókulcsot csökkentő tételek, például a családi kedvezmény', level: 2 },
        { text: 'Adó-visszaigénylés, ha például az éves jövedelem nem éri el a minimálbér összegét', level: 2 },
        { text: 'A dolgozó akkor is rendezhesse saját terheit, ha a foglalkoztató nem teljesíti kötelezettségét.', level: 2 }
      ]
    },
    {
      title: 'Bevezetés és tesztelés',
      items: [
        { text: 'Valós használatban derül ki, hogy az adózó, a könyvelő, a NAV-ügyintéző, az űrlap és a fizetési folyamat azonosan értelmezi-e az új szabályt.', level: 0 },
        { text: 'Kötelező átálláskor ezek pótlékot, hibás bevallást vagy határidőmulasztást okozhatnak az ügyfélnek.', level: 0 },
        { text: 'Az új folyamat először választhatóan, a régi mellett fusson, hogy a hibákat a régi folyamat kivezetése előtt javíthassák.', level: 0 },
        { text: 'Példa: választható indulás szeptemberben, a régi folyamat kivezetése januárban, a tapasztalatok alapján.', level: 1 },
        { text: 'Csökkentett bevezető adókulcs ösztönözheti az önkéntes részvételt.', level: 1 },
        { text: 'A kedvezmény nyilvános tesztelési ösztönző legyen: a résztvevők visszajelzése segítse a finomhangolást.', level: 2 },
        { text: 'Valódi vészhelyzettel nem indokolható adóváltozásnál legalább három hónap legyen a kihirdetés és a hatálybalépés között.', level: 1 },
        { text: 'Ha a módosítás korábbi bevezetésére is lett volna lehetőség, a Magyar Közlönyben való kihirdetést legalább hat hónapos átmeneti időszak kövesse.', level: 1 },
        { text: 'A fő kockázat, hogy a szabályt a felület, a könyvelői gyakorlat és a NAV-háttérfolyamatai eltérően értelmezik.', level: 1 },
        { text: 'A hirtelen, visszamenőleges vagy csak néhány napos felkészülést engedő átállás helyett legyen próbaidőszak, visszajelzési kör és dokumentált javítási lista.', level: 1 }
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
            { text: 'A fizetési tájékoztató egyértelműen közölje az összeget, a jogcímet, az időszakot, a határidőt és az azonosítót.', level: 0 },
            { text: 'A határidőre rendezett tétel ügyféloldalon későbbi korrekció esetén is maradjon teljesített.', level: 0 },
            { text: 'A NAV közüzemi számlához hasonló fizetési értesítőt állítson ki; a határidőre befizetett értesítő maradjon lezárt.', level: 1 },
            { text: 'A későbbi korrekció külön helyesbítő tételként, indoklással és új határidővel jelenjen meg.', level: 1 }
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
          items: ['KOMA-státusz és előzmények']
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
          title: 'Adóraktári készlet és mozgás',
          items: ['Készletállomány és készletmozgások listája']
        },
        {
          title: 'A jövedéki biztosíték szabad kerete',
          items: ['Az aktuális biztosítékkeret és felhasználása']
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
        place: 'NAV kiemelt ügyfélszolgálat',
        address: '1054 Budapest, Széchenyi u. 2.',
        datetime: '2026. február 18., 10:30',
        mapUrl: 'https://maps.google.com/?q=1054+Budapest+Sz%C3%A9chenyi+u.+2'
      },
      {
        id: 'app-2',
        place: 'Kormányablak – XIII. kerület',
        address: '1133 Budapest, Váci út 62-64.',
        datetime: '2026. február 26., 09:15',
        mapUrl: 'https://maps.google.com/?q=1133+Budapest+V%C3%A1ci+%C3%BAt+62-64'
      },
      {
        id: 'app-3',
        place: 'Önkormányzati ügyféltér',
        address: '1146 Budapest, Thököly út 11.',
        datetime: '2026. március 5., 14:00',
        mapUrl: 'https://maps.google.com/?q=1146+Budapest+Th%C3%B6k%C3%B6ly+%C3%BAt+11'
      }
    ],
    'user-2': [
      {
        id: 'app-4',
        place: 'Kormányablak – XVI. kerület',
        address: '1163 Budapest, Veres Péter út 112.',
        datetime: '2026. február 20., 08:45',
        mapUrl: 'https://maps.google.com/?q=1163+Budapest+Veres+P%C3%A9ter+%C3%BAt+112'
      },
      {
        id: 'app-5',
        place: 'NAV ügyfélszolgálat',
        address: '1081 Budapest, József körút 18.',
        datetime: '2026. február 27., 11:00',
        mapUrl: 'https://maps.google.com/?q=1081+Budapest+J%C3%B3zsef+k%C3%B6r%C3%BAt+18'
      }
    ],
    'user-3': [
      {
        id: 'app-6',
        place: 'Önkormányzati ügyféltér',
        address: '1123 Budapest, Alkotás u. 1.',
        datetime: '2026. február 19., 13:20',
        mapUrl: 'https://maps.google.com/?q=1123+Budapest+Alkot%C3%A1s+u.+1'
      },
      {
        id: 'app-7',
        place: 'Kormányablak – XI. kerület',
        address: '1117 Budapest, Fehérvári út 52.',
        datetime: '2026. február 25., 09:00',
        mapUrl: 'https://maps.google.com/?q=1117+Budapest+Feh%C3%A9rv%C3%A1ri+%C3%BAt+52'
      },
      {
        id: 'app-8',
        place: 'NAV kiemelt ügyfélszolgálat',
        address: '1054 Budapest, Széchenyi u. 2.',
        datetime: '2026. március 3., 15:10',
        mapUrl: 'https://maps.google.com/?q=1054+Budapest+Sz%C3%A9chenyi+u.+2'
      },
      {
        id: 'app-9',
        place: 'Egészségügyi központ',
        address: '1037 Budapest, Bécsi út 96.',
        datetime: '2026. március 10., 10:00',
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
    { label: 'Kormányablak', detail: 'Okmányügyek és egyéb ügyintézés' },
    { label: 'Önkormányzat', detail: 'Helyi ügyek' },
    { label: 'Bűnügy', detail: 'Rendőrség' },
    { label: 'Egészségügy', detail: 'EESZT' },
    { label: 'Munkaügy', detail: 'Munkaügyi központ' },
    { label: 'Jog', detail: 'Bíróság, ügyészség, fogyasztóvédelem, igazságügy és köztársasági elnök' },
    { label: 'Szolgáltatások', detail: 'Közüzemi számlák, BKV-bérletek, autópálya-matricák és parkolás' }
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
        return 'Felhasználó felfüggesztése';
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
