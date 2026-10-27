# E-közig - prototípus kézikönyv

Ez a kézikönyv a jelenlegi Angular alkalmazás működését írja le a kipróbáló és a fejlesztő szemszögéből. A dokumentum a `master` ág `e4e08d59a0fc` forrásállapotára épül. Ahol a felület csak tervet vagy helykitöltőt mutat, ezt külön jelöli. A képernyőn szereplő személyek, összegek, határidők és iratszámok mintaadatok.

## 1. Rendeltetés és hatókör

Az E-közig egy nyilvános, magyar nyelvű felületi prototípus. DÁP-jellegű ügykörválasztást és NAV-ihletésű adóügyi nézeteket kapcsol össze. A cél az, hogy a dokumentumok, bizonylatok, űrlapok és képviseleti helyzetek felhasználói élményéről korai visszajelzés szülessen. A prototípus életszerű példaadatokkal tesztelhető, de nem kapcsolódik élő közigazgatási háttérrendszerhez.

**A dokumentum háromféle állapotot különböztet meg:** (1) működő helyi felületi interakció, (2) böngészőben helyben mentett adat és (3) bemutató vagy helykitöltő elem. A gomb láthatósága önmagában nem jelent hivatali ügyintézést. Az éles benyújtás, a valódi iratletöltés, az autentikáció és a szerveroldali adatkezelés nem része a jelenlegi megvalósításnak.

### 1.1 Kinek szól?

- **Kipróbálóknak:** a navigáció, keresés, szűrés és űrlapnézetek áttekintéséhez.
- **Szakmai véleményezőknek:** a bemutatott folyamatok és a tényleges megvalósítás elválasztásához.
- **Fejlesztőknek:** az Angular modulok, mintaadatszolgáltatások és helyi adattár megértéséhez.

### 1.2 A bemutató nyitása

Az élő prototípus címe: `https://fssrepository.github.io/e-kozig/`. A forráskód: `https://github.com/fssrepository/e-kozig/`. A visszajelzés a repó GitHub Issues felületén rögzíthető. A kezdőútvonal a `/home`; a gyökérútvonal oda irányít át. A prototípus jelenlegi felülete magyar nyelvű.

## 2. Felület, ügykör és felhasználó

### 2.1 Fő navigáció

A felső vezérlőben a menü és a felhasználóválasztó nyitható meg. Az asztali és mobil nézet ugyanazokat a fő területeket éri el eltérő elrendezésben. Az Adóügy ügykör kiválasztásakor a menüben a Kezdőoldal, Dokumentumok, Bizonylatok, Kapcsolat és Beállítások jelennek meg. Az Űrlapszerkesztő adminisztrációs menüpontja is látható, mert a prototípusban az `isAdmin` jelző rögzítetten igaz; ez nem jogosultságvizsgálat.

A többi ügykör - Kormányablak, Önkormányzat, Bűnügy, Egészségügy, Munkaügy, Jog és Szolgáltatások - kiválasztása a kezdőoldalra visz. A Dokumentumok és Bizonylatok menüpont csak az Adóügy menüjében jelenik meg. Az ügykörváltás nem helyettesít valódi hivatali bejelentkezést.

### 2.2 Felhasználóválasztó és jelzések

A felhasználóválasztó három előre megadott szereplőt tartalmaz. Váltáskor a választott szereplőhöz tartozó minta-időpontok és ügykörszámlálók látszanak, a kiválasztott ügykör Adóügyre áll vissza. A jelvények értékei a kliensben tárolt példaszámokból számolódnak; nem szerverről érkező értesítések és nem bizonyítják ügyek vagy iratok tényleges állapotát.

A felhasználópanelen időpontlista, ügykörlista és felhasználókezelési mintanézetek vannak. Az időpontok a kliensben előre megadott objektumokból származnak. A térképikon hivatkozást nyithat meg, de az időpontfoglalás vagy időpontmódosítás nincs összekötve külső rendszerrel.

### 2.3 Útvonalak

- `/home`: kezdőoldal és ügykörhöz kötött tartalom.
- `/documents`: dokumentumlista, részletek, űrlapkereső és helyi ONYA-mintaűrlap.
- `/documents/szamlak`: bizonylatlista, bevallási időszakok és számlaszerkesztési minta.
- `/admin/forms`: űrlap- és szakaszsablon-szerkesztő.
- `/appointments`, `/offices`, `/information`: jelenleg rövid, szöveges helykitöltő oldalak.

## 3. Kezdőoldal és részletes keresés

Adóügy esetén a kezdőoldal a NAV-hoz kapcsolódó lehetséges területeket sorolja fel. A dokumentumok, űrlapok, online számla, adószámla, adónaptár, képviselet, tárhely és Cégkapu témái itt javaslatként szerepelnek. A felsorolás nem jelenti, hogy minden felsorolt funkció önálló, kész modulban működik. A kezdőoldal egyes további szövegei közpolitikai elképzeléseket is bemutatnak; ezek nem a prototípus technikai képességei.

### 3.1 Keresési folyamat

1. Írj kifejezést a kezdőoldali keresőbe, és add hozzá keresési feltételként.
2. A felvett kifejezés chipként jelenik meg; a chip eltávolítható.
3. A részletes keresés menüjében főmenü, almenü és elem között lehet lépkedni.
4. Egy elem kiválasztása helyi felugró tartalmat nyit. A menü adatai statikusak; a kiválasztás nem indít NAV-lekérdezést.

Az alkalmazás a menüszövegekből épít fel hierarchiát. A kezdőoldal aktuális tartalmát az ügykörválasztó állapota befolyásolja; az Adóügytől eltérő ügyköröknek eltérő tájékoztató tartalom jelenhet meg.

## 4. Dokumentumok

A Dokumentumok oldal az Adóügy menüben érhető el. A lista és a részletek a `DocumentService` forrásba égetett rekordjaiból épülnek fel. A szolgáltatás RxJS `of(...)` értékkel adja vissza ezeket; nincs hálózati iratlekérdezés. Egy sor ügyfélhez, űrlaphoz, időponthoz, státuszhoz és alárendelt iratokhoz kapcsolódik. A csatolmányoknál látható `.pdf` nevek mintaadatok, nem a repóban lévő letölthető fájlok.

### 4.1 Keresés és szűrés

1. A felső kereső ügyszám, iktatószám, ügyfél és űrlap alapján kínál találatokat. Az Enter billentyű a keresőszöveget felvett keresési feltétellé alakítja.
2. Az Ügyfél, Dátum, Űrlap és Státusz szűrő több kiválasztást is kezel; az Olvasatlan külön kapcsoló.
3. A listában a különböző szűrőcsoportok együtt érvényesülnek. A több keresőchip mindegyikének illeszkednie kell; egy csoporton belül a kiválasztott értékek valamelyike elegendő.
4. Az eredmények időrendben jelennek meg. Az oldalméret 5, 10 vagy 25 sorra állítható; mobilon a listakezelő további elemeket tölthet a már helyben lévő adatokból.

A szűrés a böngészőben fut. A frissítés rövid, szimulált várakozást mutat; nem szerveroldali szinkron. A dátumszűrő a dokumentum dátumát vizsgálja, a kijelölt kezdő és záró napot is beleértve.

### 4.2 Részletek és műveletek

Egy sorra kattintva megnyílik a dokumentum részlete. Az alárendelt tételek státusza, iktatószáma, KR-száma, űrlapneve és csatolmányneve megtekinthető. A felület jelzi a kiegészítéseket, és külön kezeli az űrlaptípushoz tartozó mellékleteket. A válasz és a letöltés vezérlői demonstrációs üzenetet adnak; tényleges e-Papír küldés vagy fájlletöltés nincs. Az ONYA megnyitására utaló művelet is helyi jelzés.

Az új létrehozása gomb két mintafolyamatot nyit: Új levél és Új dokumentum. A levélpanelben tárgy és üzenetszöveg állítható össze, de a Küldés gombhoz nincs küldési kezelő. Az új dokumentum panelben űrlaptípus kereshető, és a mintasablon megnyitható.

### 4.3 ONYA-mintaűrlap és helyi mentés

Az űrlapkereső kategóriái és találatai a helyi `nyomtatvanyok.txt` állományból, illetve a sablonokból származnak. Egy űrlap kiválasztásakor a felület a kód vagy név alapján próbál megfelelő helyi sablont találni; ha nincs találat, az első sablont mutatja. Az űrlap oldalai között lehet váltani. Alapállapotban az adatok csak olvashatók; az Adatok szerkesztése ikon nyitja a szerkeszthető módot. A mintafelhasználóhoz rendelt mezők előre kitöltődhetnek.

A Mentés gomb a kitöltött értékeket a böngésző IndexedDB-adatbázisába írja `FormDocument` rekordként. Ez helyi mentés, nem ONYA- vagy NAV-benyújtás. A felületben külön látható piszkozatlista előre megadott mintaelemekből áll; a kódban nem a mentett `FormDocument` rekordokból töltődik. A helyi adatbázis törlése vagy másik böngészőprofil használata az ott mentett adatokat nem viszi át.

## 5. Bizonylatok és bevallási időszakok

A `/documents/szamlak` oldal a `InvoiceService` helyi mintaadatait jeleníti meg. Egy rekordnak ügyfele, státusza, iránya, bizonylattípusa, száma, dátuma és alárendelt tételei vannak. Az oldal számlát, nyugtát, vámhatározatot és egyéb bizonylatot is mintaként szerepeltet. A státuszok a bemutató adatait címkézik, nem hivatalos feldolgozási állapotok.

### 5.1 Lista és részlet

1. Keress bizonylatszám, ügyfél vagy típus szerint. Az Enterrel hozzáadott keresőchip a lista szűrésében vesz részt.
2. Szűrj Ügyfél, Bizonylattípus, Dátum, Státusz és Irány alapján. A dátum a bizonylat rekordjának időpontjára vonatkozik.
3. Nyiss meg egy sort a részletek és a mellékletnevek megtekintéséhez.
4. A csatolmány letöltési művelete figyelmeztetést ad; tényleges fájlletöltést nem végez.

Az eredmények időrendben jelennek meg. A frissítés és a rövid betöltési állapot helyben újraszámolja a listát. A szűrők a meglévő mintaadatokat szűkítik, nem új adatot kérnek le.

### 5.2 Bevallási időszakok

A lebegő időszakkereső gomb külön felugró ablakot nyit. Itt ügyfél, dátum és státusz szűrő, valamint keresőchip használható. Az időszak a kezdő és záró dátum átfedése alapján található meg; a találatok záródátum szerint csökkenő sorrendbe kerülnek. Az időszakok szintén a szolgáltatás előre megadott rekordjai. A „Nyitott” és „Lezárt” címkék szemléltető adatok.

### 5.3 Számla létrehozása: szerkesztési minta

A Számla létrehozása panel címzettadatokat, bizonylattípust, keltezési és teljesítési dátumot, fizetési módot, határidőt, bankszámlaszámot és tételsort mutat. A tételnél megnevezés, nettó egységár, mennyiség, mértékegység és áfakulcs választható. Új tétel hozzáadható, a fölösleges tétel eltávolítható. A nettó összeg a nettó egységár és mennyiség szorzata; az áfa és a bruttó összeg a kiválasztott kulcsok alapján a kliensben számolódik.

**A panel nem hoz létre valódi bizonylatot.** A „Bizonylat létrehozása” és a fájlkiválasztó gombhoz nincs alkalmazásművelet kötve. A kitöltött címzettadatok és tételek nem kerülnek a `InvoiceService` listájába és nem maradnak meg szerveroldalon. Az áfakulcsok itt a felület példái; a kézikönyv nem ad adózási tanácsot.

## 6. Űrlapszerkesztő

Az adminisztrációs menüpont a `/admin/forms` útvonalon nyitja a vizuális szerkesztőt. A kód jelenleg minden kipróbálónak megjeleníti az adminisztrációs menüt; az oldal használata nem jogosultságellenőrzés eredménye. A szerkesztő két egymáshoz kapcsolódó tárgyat kezel: a teljes űrlapot (`FormTemplate`) és az újrahasznosítható szakaszsablont (`FormSectionDefinition`).

### 6.1 Űrlap kiválasztása és létrehozása

A felső választóban egy meglévő űrlap nyitható meg. Az Új űrlap gomb névmegadással hoz létre üres, egyoldalas űrlapot. A létrehozáskor 12 oszlopos, 12 soros rács keletkezik, alapértelmezett oldalcímmel. A másolási művelet külön azonosítóval menti az aktív űrlap másolatát. Az űrlapok a böngésző helyi tárába kerülnek; a lista név szerint rendezett.

### 6.2 Szerkesztés és elrendezés

A szerkesztés módot a sablon szerkesztése vezérlő kapcsolja. A bal oldalsáv Elemszekciójából kattintással vagy húzással lehet elemeket a vászonra tenni; a Sablonok szekcióban előre megadott vagy helyben mentett szakaszok kereshetők. Az űrlap több oldalt tartalmazhat. A vásznon a szakaszok és mezők rácskoordinátákat, valamint oszlop- és sorkiterjedést tárolnak. A felület az elemek mozgatását, átméretezését, többes kijelölését, másolását és bizonyos csoportosítási műveleteket kínálja.

A mezőtípusok: fejléc, egysoros szöveg, többsoros szöveg, dátum, lista, jelölőnégyzet, szám, e-mail és telefon. A mezőhöz címke, helykitöltő szöveg, kötelezőség, listaopciók és bizonyos esetekben előtöltési kulcs adható meg. A felület a rács oszlopainak és sorainak számát is módosíthatja. A szerkesztés közben megadott értékek nem jelentenek tényleges hivatali űrlapdefiníciót.

### 6.3 Szakaszsablonok

A szakaszsablon saját címet, kódot, leírást, mezőlistát és méretet tartalmaz. Új sablon üresen indítható, majd mezőkkel feltölthető és menthető. Kijelölt mezőkből szintén lehet új sablont készíteni. A könyvtárban a sablon kereshető és törölhető. A mentett szakaszsablon később más űrlapba is beilleszthető. A kódban több előre megadott sablon szolgál kiindulópontként.

### 6.4 Előnézet, automatikus kitöltés és mentés

Az ONYA-előnézet az aktuális sablon oldalait olvasható módban mutatja. A bemutató felhasználó adatai az `autofillKey` jelölésű mezőkbe kerülhetnek, az Automatikus kitöltés művelet pedig az aktív űrlap értékeit tölti ki. A szerkesztő a sablonszerkezetet menti, nem küld be ügyet. A Mentés után a módosított sablon az IndexedDB-ben marad az adott böngészőprofilban. Mentési hiba esetén a felület külön státuszüzenetet jelez.

### 6.5 Helyi adattár

A `FormEditorStoreService` az `e-kozig-form-editor` nevű, 3-as verziójú IndexedDB-adatbázist használja. Egy `formEditorTables` objektumtárban tárolja a `formTemplates`, `sectionTemplates` és `formDocuments` táblákat. Első használatkor a forrásban definiált alapűrlapok és szakaszok kerülnek a helyi tárba. A régebbi objektumtárakból történő átvételre is van kód. A tárolás böngészőprofilhoz kötött: másik eszközön, másik profilban vagy helyi adatok törlése után nem várható automatikus egyezés.

## 7. Jelenlegi helykitöltő oldalak

Az `/appointments` útvonal egy címet és rövid mondatot mutat az időpontfoglalásról; ezen az oldalon nincs foglalási folyamat. A felhasználópanelen látható minta-időpontok ettől külön, az alkalmazás komponensében vannak megadva. Az `/offices` útvonal a képviseletekkel kapcsolatos szöveges tervet mutatja, többek között a HIPA-választás kívánt helyéről; nincs kész képviseleti lista vagy jogosultságkezelés. Az `/information` útvonal jelenleg rövid tájékoztató helykitöltő. Ezeket nem szabad kész ügyintézési modulnak tekinteni.

A Kapcsolat, Beállítások, Egyenleg és több felhasználói panel a felületi elképzelés része. Megnyitásuk mintatartalmat vagy helyi felugró nézetet ad. A számlaszerkesztési és levélküldési gombokhoz hasonlóan itt sem szabad a megjelenítést háttérrendszeri műveletként értelmezni.

## 8. Technikai felépítés

Az alkalmazás Angular 21-es böngészős kliens, Angular Material és CDK komponensekkel, RxJS adatfolyamokkal. A gyökérútvonal a kezdőoldalra irányít; a funkciók külön, késleltetetten betöltött modulokban vannak. A `src/app/ui/` újrahasznált lista-, szűrő-, dátumtartomány- és táblakomponenseket tartalmaz. A `src/app/shared/` az ügykörválasztást, jelzéseket és menüjelvényeket kezeli.

### 8.1 Adatforrások és állapot

- A dokumentum- és bizonylatlisták forrásba írt mintaadatokat használnak; a szolgáltatások `of(...)` megfigyelhető értéket adnak vissza.
- Az ügykör, kiválasztott felhasználó, felugró ablakok és szűrők az aktuális futás kliensoldali állapota.
- Az űrlapszerkesztő sablonjai és az ONYA-mintaűrlap mentett adatai IndexedDB-ben tárolódnak.
- A nyomtatványkereső a `src/assets/data/nyomtatvanyok.txt` statikus erőforrást `fetch(...)` hívással olvassa.
- A vizsgált alkalmazáskód nem tartalmaz `HttpClient` alapú alkalmazás-API hívást. A prototípus nem azonos egy NAV-, DÁP- vagy más hivatali szolgáltatással.

### 8.2 Fejlesztői indítás és ellenőrzés

1. Telepítés: `npm ci`.
2. Helyi fejlesztői szerver: `npm run ng -- serve` (a `package.json` nem definiál `start` scriptet).
3. Fejlesztői build: `npm run build`; produkciós build: `npm run build:prod`.
4. Tesztek: `npm test`; lefedettségi futás: `npm run test:coverage`.
5. GitHub Pages kimenet: `npm run build:github`, amely `/e-kozig/` base href mellett a `docs/` könyvtárat építi és `.nojekyll` fájlt hoz létre.

A `docs/`, `dev/`, `coverage/` és `test-results/` generált kimenetek; a gyökér `.gitignore` kizárja őket a `master` ágon. A README szerint a publikált Pages-forrás a külön `gh-pages` ág `/docs` könyvtára. A PDF kiadvány nem része az Angular buildnek; a saját generátorával épül újra.

## 9. Működési határok és visszajelzés

**Helyben működik:** menü- és felhasználóválasztás, listakeresés és szűrés, rekordrészletek, bizonyos felugró szerkesztők, űrlapsablon-szerkesztés és IndexedDB-mentés. **Csak bemutató:** hivatali iratlekérés, e-Papír-küldés, számla vagy csatolmány letöltése, tényleges bizonylatlétrehozás, időpontfoglalás, képviseleti jogosultság érvényesítése és élő értesítések.

Visszajelzésben érdemes megadni az útvonalat, a kiválasztott ügykört, a kipróbált lépéseket, a várt eredményt és a ténylegesen látható viselkedést. Az észrevételek helye: `https://github.com/fssrepository/e-kozig/issues`. Mintaadat vagy felületi szöveg alapján ne következtess valódi jogi, adózási vagy ügyállapotra.

## 10. Végigjárható kipróbálási példák

### 10.1 Dokumentum keresése és a korlát ellenőrzése

Válaszd az Adóügy ügykört, majd nyisd meg a Dokumentumok menüpontot. Írj be egy, a listában látható ügyfélnevet vagy űrlapkódot a keresőbe, és Enterrel vedd fel feltételként. A találatokat szűkítsd Státusz vagy Dátum alapján, majd nyiss meg egy sort. A részletben nézd meg az alárendelt iratok iktatószámát és csatolmánynevét. A letöltési vezérlő a prototípus korlátját jelző üzenetet adja; a minta `.pdf` névhez nem tartozik letölthető irat. A visszalépés után a listát a szűrők eltávolításával lehet újra bővíteni.

### 10.2 Bizonylat és időszak összehasonlítása

A Bizonylatok oldalon keress bizonylatszámra vagy ügyfélre. A szűrők közül válassz típust és irányt; a találati sor megnyitása az adott bizonylat részleteit mutatja. Ezután nyisd meg a bevallási időszakok felugró ablakát, ahol ugyanannak az ügyfélnek a mintabeli időszaka külön kereshető. Az időszak státusza és a bizonylat státusza külön mező és külön mintaadat. A Számla létrehozása panelen módosítsd a tétel nettó árát, mennyiségét és áfakulcsát: a számolt összeg változik. Bezárás után ne várj új bizonylatsort, mert a létrehozási gomb jelenleg nem ment rekordot.

### 10.3 Sablon módosítása és ONYA-mintaűrlap mentése

Az Űrlapszerkesztőben válassz sablont, kapcsold be a szerkesztési módot, majd adj hozzá egy mezőt az oldalsávból. Állítsd a címkéjét, és mentsd a sablonszerkezetet. A Dokumentumok oldalon az Új dokumentum folyamatban nyiss meg egy űrlapmintát. Ha az űrlapkód nem egyezik mentett sablonnal, a felület az első sablont választja, ezért ellenőrizd a megnyitott sablon nevét. Kapcsold be az adatbeviteli módot, tölts ki mezőt, majd mentsd. A megerősítés a helyi IndexedDB-be írt adatra vonatkozik. A külön mintapiszkozat-listában nem jelenik meg az így mentett rekord, mert a két lista forrása különböző.

### 10.4 Mit érdemes feljegyezni hibajelzéshez?

A reprodukálható észrevétel tartalmazza a megnyitott útvonalat, a kiválasztott ügykört, a szűrőket vagy űrlapkódot, a pontos lépéseket és a látható eredményt. Helyi mentési hiba esetén a böngészőprofil és az IndexedDB hozzáférhetősége is lényeges; a szerkesztő „A helyi űrlaptár nem érhető el” üzenetet adhat, ha a tár nem nyitható meg. Ne tegyél valódi személyes vagy adózási adatot a nyilvános prototípusba vagy a nyilvános GitHub-hibajegybe.

## 11. Forráskód-térkép

- `src/app/app.routes.ts`: fő útvonalak és késleltetett modulbetöltés.
- `src/app/app.ts` és `app.html`: felső navigáció, felhasználó- és ügykörválasztás, jelvények.
- `src/app/home/`: kezdőoldal és hierarchikus menükeresés.
- `src/app/document/components/document.component.ts`: dokumentumlista, részletek, űrlapválasztás és helyi űrlapadat-mentés.
- `src/app/document/components/invoices.component.ts`: bizonylatlista, időszaknézet és számlaszerkesztési minta.
- `src/app/document/services/`: dokumentum- és bizonylat-mintaadatok.
- `src/app/admin/components/form-editor/`: űrlap- és szakaszsablon-szerkesztő.
- `src/app/admin/services/form-editor-store.service.ts`: helyi IndexedDB-adattár.
- `src/app/admin/models/form-editor.model.ts`: sablonok, mezők, oldalak és mentett űrlapadatok típusai.
- `src/app/ui/` és `src/app/shared/`: közös felületi elemek és alkalmazásállapot.
- `angular.json`, `package.json`, `README.md`, `README.hu.md`: build, teszt, publikálás és rövid projektbemutatás.
