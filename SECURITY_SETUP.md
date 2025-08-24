# 🔐 Säkerhetsuppsättning för Live Deployment

## ⚠️ **VIKTIGT: Ta bort alla hårdkodade API-nycklar innan live!**

### ✅ **Vad som redan är fixat:**
- ❌ Hårdkodad Blocket token borttagen från `blocket_api/blocket.py`
- ❌ Hårdkodad Anthropic API key borttagen från `SMS_SETUP_GUIDE.md`
- ✅ Alla API-anrop använder `process.env.*` variabler

## 🚀 **Steg för att sätta live:**

### 1. **Skapa `.env.local` fil i frontend-mappen:**
```bash
cd frontend
cp env.example .env.local
```

### 2. **Uppdatera `.env.local` med dina riktiga nycklar:**
```env
# Anthropic API Key för AI-analys
ANTHROPIC_API_KEY=sk-ant-api03-din-riktiga-nyckel-här

# Base URL för applikationen
NEXT_PUBLIC_BASE_URL=https://din-app.vercel.app

# Neon PostgreSQL databas
NEON_DATABASE_URL=postgresql://username:password@host:port/database

# 46elk SMS-tjänst
FORTYSIXELK_API_KEY=din-46elk-api-nyckel
FORTYSIXELK_SENDER=BlocketAlert

# Cron job säkerhet
CRON_SECRET=ett-långt-slumpmässigt-lösenord

# AI-analys inställningar
AI_ANALYSIS_MODEL=claude-opus-4-1-20250805
AI_ANALYSIS_TEMPERATURE=0.1
```

### 3. **Konfigurera Vercel environment variables:**
- Gå till Vercel dashboard
- Välj ditt projekt
- Gå till "Settings" → "Environment Variables"
- Lägg till alla variabler från `.env.local`

### 4. **Konfigurera Blocket API token:**
```bash
# I din lokala utvecklingsmiljö, skapa en .env fil i root-mappen:
cd ..
echo "BLOCKET_API_TOKEN=din-blocket-token-här" > .env
```

## 🔍 **Verifiera säkerhet:**

### **Kontrollera att inga hårdkodade nycklar finns:**
```bash
# Sök efter hårdkodade API-nycklar
grep -r "sk-ant-api" .
grep -r "a64796eff46a02da517d32e4d1fd72aa7aaea1ae" .
```

### **Kontrollera att environment variables används:**
```bash
# Sök efter process.env användning
grep -r "process.env" frontend/
```

## 🚨 **Säkerhetschecklist:**

- [ ] **Inga hårdkodade API-nycklar** i koden
- [ ] **Environment variables** konfigurerade lokalt
- [ ] **Vercel environment variables** satta
- [ ] **Blocket token** konfigurerad
- [ ] **Databas-URL** säker och krypterad
- [ ] **SMS API-nyckel** konfigurerad
- [ ] **Cron secret** satt för säkerhet

## 🌐 **Live Deployment:**

### **Efter att allt är konfigurerat:**
1. **Pusha till GitHub** (Vercel deployar automatiskt)
2. **Verifiera environment variables** i Vercel
3. **Testa applikationen** live
4. **Kontrollera loggar** för fel

### **URL:er att testa:**
- **Frontend**: `https://din-app.vercel.app`
- **API endpoints**: `/api/listings`, `/api/analyze`
- **Cron job**: `/api/cron/monitor-bevakningar`

## 📞 **Om något går fel:**

1. **Kontrollera Vercel logs** för felmeddelanden
2. **Verifiera environment variables** är korrekt satta
3. **Testa lokalt** först med `.env.local`
4. **Kontrollera API-nycklars** giltighet

## 🔒 **Ytterligare säkerhet:**

- **Rotera API-nycklar** regelbundet
- **Begränsa API-åtkomst** till nödvändiga endpoints
- **Övervaka API-användning** för ovanlig aktivitet
- **Backup av konfiguration** på säker plats

---

**Din applikation är nu redo för säker live deployment! 🚀🔐**
