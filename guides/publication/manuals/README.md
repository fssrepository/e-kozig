# E-közig prototípus kézikönyv

Az [1.0.0-s magyar kézikönyv](E_Kozig_Prototype_Guide_v1.0.0_HU.pdf) a tényleges
felületi folyamatokat, az adatforrásokat, a helyi mentést, a prototípus korlátait,
a fejlesztői felépítést és a build/teszt/publikálás lépéseit dokumentálja.

A szerkeszthető tartalom a
[`guides/development/reference/prototype-guide-hu.md`](../../development/reference/prototype-guide-hu.md)
fájlban van. A PDF-et ez a mappában lévő `build-guide.py` állítja elő.

Újraépítés a repó gyökeréből:

```sh
python3 guides/publication/manuals/build-guide.py
```

Szükséges: Python 3, ReportLab és DejaVu Sans betűkészlet. Tartalmi változtatás
után a Markdown forrást, a PDF-et és a README-hivatkozásokat együtt frissítsd;
rendereld és nézd át a PDF minden oldalát. A kézikönyv a forrásban megnevezett
revíziót írja le, ezért új forrásállapotnál ezt is frissíteni kell.
