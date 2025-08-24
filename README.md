# Blocket Listings Frontend

En elegant Next.js frontend för att visa dina Blocket bevakningar med svenska text och bildslider.

## 🚀 Funktioner

- **Svenska gränssnitt** - Allt på svenska
- **Bildslider** - Navigera mellan bilder med pilar och miniatyrer
- **Sökfunktion** - Sök bland annonser
- **Prisfilter** - Filtrera efter prisintervall
- **Responsiv design** - Fungerar på alla enheter
- **Elegant design** - Svart och vit tema med shadcn/ui

## 📋 Krav

- Node.js 18+ 
- npm eller yarn

## 🛠️ Installation

1. **Installera beroenden:**
```bash
cd frontend
npm install
```

2. **Starta utvecklingsservern:**
```bash
npm run dev
```

3. **Öppna i webbläsaren:**
```
http://localhost:3000
```

## 🎨 Användning

### Navigera mellan annonser
- Använd **Föregående/Nästa** knappar
- Klicka på miniatyrer längst ner
- Använd tangentbord (piltangenter)

### Sök och filtrera
- **Sökfält** - Sök i titlar och beskrivningar
- **Prisfilter** - Sätt min/max pris
- **Realtidsfiltrering** - Resultat uppdateras direkt

### Bildvisning
- **Huvudbild** - Stora bilder med navigation
- **Miniatyrer** - Klicka för att byta bild
- **Bildräknare** - Se vilken bild du tittar på

## 🏗️ Projektstruktur

```
frontend/
├── app/
│   ├── api/listings/     # API för att hämta annonser
│   ├── globals.css       # Globala stilar
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Huvudsida
├── components/
│   ├── ui/               # shadcn/ui komponenter
│   ├── ImageSlider.tsx   # Bildslider
│   └── ListingCard.tsx   # Annonskort
├── lib/
│   └── utils.ts          # Hjälpfunktioner
└── package.json
```

## 🔧 Konfiguration

### Anpassa färger
Redigera `app/globals.css` för att ändra färgschema.

### Lägg till fler bevakningar
Uppdatera `app/page.tsx` för att hantera fler bevakningar.

### Ändra språk
Alla texter finns i komponenterna - ändra direkt där.

## 🚀 Produktion

```bash
npm run build
npm start
```

## 📱 Responsiv design

- **Mobil** - En kolumn layout
- **Tablet** - Två kolumner
- **Desktop** - Flera kolumner med miniatyrer

## 🎯 Komponenter

### ImageSlider
- Automatisk bildhantering
- Navigationsknappar
- Miniatyrer för snabb navigation
- Responsiv design

### ListingCard
- Komplett annonsinformation
- Pris, plats, datum
- Säljarinformation
- Direktlänkar till Blocket

### Huvudsida
- Sök och filtrering
- Navigation mellan annonser
- Översikt över alla annonser
- Laddningsindikatorer

## 🔗 Länkar

- **Blocket** - Direktlänkar till ursprungliga annonser
- **Bilder** - Högupplösta bilder från Blocket
- **Kontakt** - Säljarkontakt (kommer snart)

## 🐛 Felsökning

### Bilder laddas inte
- Kontrollera att `bevakningar_listings.json` finns
- Verifiera att API-routen fungerar

### Sök fungerar inte
- Kontrollera konsolen för JavaScript-fel
- Verifiera att data laddas korrekt

### Långsamma prestanda
- Bilder kan ta tid att ladda
- Använd miniatyrer för snabbare navigation

## 📈 Framtida förbättringar

- [ ] Kontaktformulär för säljare
- [ ] Favoritlistor
- [ ] Prisövervakning
- [ ] Push-notifikationer
- [ ] Export till CSV/PDF
- [ ] Mörkt tema
- [ ] Offline-stöd

## 🤝 Bidrag

Förslag och buggrapporter välkomnas! Skapa en issue eller pull request.

## 📄 Licens

Samma som huvudprojektet.
