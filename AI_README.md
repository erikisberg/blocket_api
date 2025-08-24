# 🤖 AI-värderingsanalys för Blocket Listings

## 🎯 **Vad AI:n gör**

Vår AI (Claude från Anthropic) analyserar varje Blocket-annons för att bedöma om objektet kan vara **undervärd** och ge dig en **handelsfördel**.

## 📊 **Poängskala (1-5)**

| Poäng | Betydelse | Färg | Handelsrekommendation |
|-------|-----------|------|----------------------|
| **1** | **Mycket övervärderat** | 🔴 Röd | Undvik - priset är för högt |
| **2** | **Övervärderat** | 🟡 Gul | Tveksamt - priset är något för högt |
| **3** | **Rättvärderat** | 🔵 Blå | Neutralt - priset verkar rimligt |
| **4** | **Undervärderat** | 🟢 Grön | **Köp!** - priset verkar för lågt |
| **5** | **Mycket undervärderat** | 🟢 Grön | **Köp snabbt!** - priset är uppenbart för lågt |

## 🧠 **Vad AI:n analyserar**

### **📝 Annonsinnehåll**
- Titel och beskrivning
- Pris och valuta
- Kategori och skick
- Plats och tillgänglighet
- Säljartyp (privat/företag)

### **🖼️ Bilder (när tillgängliga)**
- Bildkvalitet
- Objektets skick
- Presentation och detaljer

### **📈 Marknadsfaktorer**
- Säsongseffekter
- Platsbaserade priser
- Säljarens betyg
- Kontaktmetoder

## 🚀 **Så här aktiverar du AI-funktionerna**

### **1. Skapa Anthropic-konto**
```
1. Gå till https://console.anthropic.com/
2. Skapa ett konto
3. Generera en API-nyckel
```

### **2. Konfigurera miljövariabler**
```bash
cd frontend
cp env.example .env.local
```

Redigera `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### **3. Installera beroenden**
```bash
npm install
```

### **4. Starta frontend**
```bash
npm run dev
```

## 🎨 **AI-funktioner i gränssnittet**

### **Individuell analys**
- **AI-kort** på varje annons
- **Starta analys** knapp
- **Poängvisning** med färgkodning
- **Detaljerad motivering** på svenska
- **Handelsrekommendationer**

### **Batch-analys**
- **Analysera alla** annonser samtidigt
- **Filtrera efter poäng** (t.ex. visa endast undervärderade)
- **Sortera efter värde** (högsta poäng först)
- **Sammanfattning** av alla resultat
- **Export-möjligheter** (kommer snart)

## 💡 **Användningsexempel**

### **Scenario 1: Snabb bedömning**
1. Bläddra till en cykel som intresserar dig
2. Klicka **"Starta AI-analys"**
3. Vänta 10-30 sekunder
4. Se poäng och motivering
5. Fatta beslut baserat på AI-bedömning

### **Scenario 2: Hitta dolda guldkorn**
1. Scrolla ner till **"AI-värderingsanalys"**
2. Klicka **"Starta batch-analys"**
3. Vänta medan AI:n analyserar alla 28 annonser
4. Filtrera för att se endast undervärderade objekt (poäng 4-5)
5. Sortera efter högsta poäng först

### **Scenario 3: Marknadsövervakning**
1. Kör batch-analys regelbundet
2. Jämför resultat över tid
3. Identifiera trender i prissättning
4. Hitta bästa köptillfällen

## 🔧 **Teknisk information**

### **AI-modell**
- **Claude Opus 4.1** från Anthropic (senaste modellen)
- **Svenska prompts** för bästa resultat
- **Låg temperatur** (0.1) för konsistenta analyser
- **Strukturerad output** i JSON-format
- **Högsta precision** för värderingsanalyser

### **Persistent lagring**
- **AI-resultat sparas** i `bevakningar_listings.json`
- **Ingen re-analys** behövs vid omladdning
- **Analys-tidsstämpel** visar när analysen gjordes
- **Automatisk cache** av alla AI-bedömningar

## 💾 **Data-struktur för AI-analys**

### **Sparade fält i JSON**
```json
{
  "ai_analysis": {
    "score": 4,
    "reasoning": "Detaljerad förklaring på svenska...",
    "confidence": 0.85,
    "factors": ["Faktor 1", "Faktor 2"],
    "recommendation": "Handelsrekommendation...",
    "analyzedAt": "2025-08-23T21:30:00.000Z",
    "model": "claude-opus-4-1-20250805"
  }
}
```

### **Fördelar med persistent lagring**
- ✅ **Ingen re-analys** - resultat sparas permanent
- ✅ **Snabb laddning** - visa cachade resultat direkt
- ✅ **Historik** - se när analysen gjordes
- ✅ **Kostnadseffektivitet** - undvik onödiga API-anrop
- ✅ **Offline-stöd** - visa tidigare analyser utan internet

### **API-anrop**
- **Individuell analys**: 1 API-anrop per annons
- **Batch-analys**: Sekventiella anrop med 1 sekunds paus
- **Rate limiting**: Respekterar Anthropic's gränser
- **Felhantering**: Automatiska fallbacks vid problem

### **Prestanda**
- **Individuell analys**: 10-30 sekunder
- **Batch-analys**: 1-2 minuter för 28 annonser
- **Caching**: Resultat sparas lokalt
- **Offline-stöd**: Kommer snart

## 🎯 **Optimerade prompts**

### **Svenska instruktioner**
AI:n får detaljerade instruktioner på svenska för att:
- Förstå svenska marknader
- Bedöma lokala priser
- Analysera svenska säljare
- Ge svenska rekommendationer

### **Expertisområden**
- **Cyklar och sportutrustning**
- **Begagnade varor**
- **Marknadsvärdering**
- **Handelsstrategier**

## 📱 **Responsiv design**

- **Mobil**: En kolumn layout
- **Tablet**: Två kolumner
- **Desktop**: Flera kolumner med detaljerad information

## 🚨 **Begränsningar och varningar**

### **AI är inte perfekt**
- **Bedömningar är uppskattningar**
- **Marknader kan ändras snabbt**
- **Lokal kunskap kan vara viktigare**
- **Använd AI som ett verktyg, inte som enda källa**

### **API-kostnader**
- **Anthropic debiterar per anrop**
- **Batch-analys kan vara dyrt**
- **Övervaka användning**
- **Använd sparsamt för kostnadseffektivitet**

## 🔮 **Framtida förbättringar**

### **Kommande funktioner**
- [ ] **Prisövervakning** över tid
- [ ] **Push-notifikationer** för undervärderade objekt
- [ ] **Export till CSV/PDF**
- [ ] **Offline-analys** med lokala modeller
- [ ] **Bildanalys** med vision-modeller
- [ ] **Marknadsjämförelser** med andra plattformar

### **Förbättringar av AI**
- [ ] **Lärande från användarfeedback**
- [ ] **Anpassade prompts** för olika kategorier
- [ ] **Historisk data** för bättre bedömningar
- [ **Ensemble-modeller** för högre tillförlitlighet

## 🐛 **Felsökning**

### **Vanliga problem**

#### **"AI-analys misslyckades"**
- Kontrollera API-nyckel i `.env.local`
- Verifiera internetanslutning
- Kontrollera Anthropic-kontot

#### **Långsamma analyser**
- Batch-analys tar tid (1-2 minuter)
- Individuell analys: 10-30 sekunder
- Nätverkshastighet påverkar prestanda

#### **Felaktiga bedömningar**
- AI är inte perfekt
- Jämför med manuell bedömning
- Använd som vägledning, inte som sanning

### **Kontakt och support**
- **GitHub Issues**: Skapa en issue för buggrapporter
- **Anthropic Support**: För API-relaterade problem
- **Dokumentation**: Läs denna README noggrant

## 📚 **Läs mer**

- **Anthropic Console**: https://console.anthropic.com/
- **Claude API Docs**: https://docs.anthropic.com/
- **Blocket API**: Huvudprojektets README
- **shadcn/ui**: https://ui.shadcn.com/

## 🎉 **Kom igång nu!**

1. **Kopiera API-nyckel** från Anthropic
2. **Konfigurera miljövariabler**
3. **Starta frontend**
4. **Börja analysera** dina Blocket-annonser
5. **Hitta undervärderade objekt** med AI-hjälp

**Lycka till med dina köp! 🚴‍♂️💎**
