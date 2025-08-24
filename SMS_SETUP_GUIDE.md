# 🚀 SMS Notifikationssystem Setup Guide

Detta system skickar automatiskt SMS när AI:en hittar undervärderade objekt (score 4-5) från dina Blocket bevakningar.

## 📋 **Förutsättningar**

- ✅ Blocket API med token
- ✅ Anthropic API för AI-analys
- ✅ Vercel konto (gratis)
- ✅ Neon PostgreSQL databas (gratis tier)
- ✅ 46elk SMS-tjänst konto

## 🗄️ **Steg 1: Skapa Neon PostgreSQL Databas**

### 1.1 Gå till Neon
- Besök [neon.tech](https://neon.tech)
- Logga in med GitHub
- Klicka "Create New Project"

### 1.2 Konfigurera projekt
- **Project Name**: `blocket-ai-monitor`
- **Region**: Välj närmaste (t.ex. Stockholm)
- **Database Name**: `blocket_monitor`
- **User**: `blocket_user`
- **Password**: Generera säker lösenord

### 1.3 Kopiera connection string
```
postgresql://blocket_user:password@ep-xxx-xxx-xxx.eu-central-1.aws.neon.tech/blocket_monitor?sslmode=require
```

### 1.4 Kör database schema
- Gå till "SQL Editor" i Neon dashboard
- Kopiera innehållet från `database/schema.sql`
- Klicka "Run" för att skapa tabeller

## 📱 **Steg 2: Konfigurera 46elk SMS-tjänst**

### 2.1 Skapa konto
- Besök [46elk.com](https://46elk.com)
- Registrera dig för ett konto
- Verifiera ditt telefonnummer

### 2.2 Hämta API-nyckel
- Gå till "API Keys" i dashboard
- Skapa ny API-nyckel
- Kopiera nyckeln

### 2.3 Testa SMS
- Använd deras test-verktyg för att skicka test-SMS
- Verifiera att du får SMS korrekt

## 🌐 **Steg 3: Konfigurera Vercel**

### 3.1 Skapa Vercel projekt
- Gå till [vercel.com](https://vercel.com)
- Logga in med GitHub
- Klicka "New Project"
- Importera ditt GitHub repo

### 3.2 Lägg till environment variables
I Vercel dashboard, gå till "Settings" → "Environment Variables":

```env
# Database
NEON_DATABASE_URL=postgresql://blocket_user:password@ep-xxx-xxx-xxx.eu-central-1.aws.neon.tech/blocket_monitor?sslmode=require

# SMS Service
FORTYSIXELK_API_KEY=your_46elk_api_key_here
FORTYSIXELK_SENDER=BlocketAlert

# AI Service
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Cron Job Security
CRON_SECRET=your_random_secret_here

# Base URL
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

### 3.3 Deploya projektet
- Vercel kommer automatiskt deploya när du pushar till GitHub
- Vänta tills deployment är klar

## ⚙️ **Steg 4: Konfigurera Lokala Inställningar**

### 4.1 Uppdatera `.env.local`
```env
# Database
NEON_DATABASE_URL=postgresql://blocket_user:password@ep-xxx-xxx-xxx.eu-central-1.aws.neon.tech/blocket_monitor?sslmode=require

# SMS Service
FORTYSIXELK_API_KEY=your_46elk_api_key_here
FORTYSIXELK_SENDER=BlocketAlert

# AI Service
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Cron Job Security
CRON_SECRET=your_random_secret_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4.2 Installera dependencies
```bash
cd frontend
npm install pg @types/pg
```

## 🧪 **Steg 5: Testa Systemet**

### 5.1 Starta lokalt
```bash
cd frontend
npm run dev
```

### 5.2 Testa SMS-inställningar
- Gå till `http://localhost:3000`
- Navigera till inställningar
- Ange ditt telefonnummer
- Klicka "Testa SMS"

### 5.3 Testa monitoring
```bash
curl -X POST http://localhost:3000/api/cron/monitor-bevakningar \
  -H "Content-Type: application/json" \
  -d '{"action": "run_once"}'
```

## 🚀 **Steg 6: Aktivera Automatisk Monitoring**

### 6.1 Vercel Cron Jobs
- Vercel kommer automatiskt köra `/api/cron/monitor-bevakningar` var 10:e minut
- Du kan se loggar i Vercel dashboard

### 6.2 Verifiera att det fungerar
- Gå till Vercel dashboard
- Klicka på ditt projekt
- Gå till "Functions" → "Cron Jobs"
- Du ska se att cron job körs regelbundet

## 📊 **Steg 7: Övervaka och Underhålla**

### 7.1 Loggar
- **Vercel**: Dashboard → Functions → Logs
- **Neon**: SQL Editor för databas-queries
- **46elk**: Dashboard för SMS-status

### 7.2 Databas-underhåll
```sql
-- Kolla SMS-notifikationer
SELECT * FROM sms_notifications ORDER BY sent_at DESC LIMIT 10;

-- Kolla high-scoring listings
SELECT title, ai_score, ai_confidence FROM listings 
WHERE ai_score >= 4 ORDER BY ai_score DESC;

-- Rensa gamla notifikationer (valfritt)
DELETE FROM sms_notifications WHERE sent_at < NOW() - INTERVAL '30 days';
```

## 🔧 **Felsökning**

### Problem: SMS skickas inte
- ✅ Kontrollera 46elk API-nyckel
- ✅ Verifiera telefonnummer-format
- ✅ Kolla SMS-limit per dag
- ✅ Verifiera att cron job körs

### Problem: AI-analys fungerar inte
- ✅ Kontrollera Anthropic API-nyckel
- ✅ Verifiera NEON_DATABASE_URL
- ✅ Kolla att databas-schema är skapat

### Problem: Cron job körs inte
- ✅ Verifiera `vercel.json` konfiguration
- ✅ Kontrollera environment variables
- ✅ Vänta 10 minuter efter deployment

## 💰 **Kostnader**

### Gratis Tier (Per månad)
- **Vercel**: $0 (10GB bandwidth, 100GB storage)
- **Neon**: $0 (3GB storage, 0.5GB RAM)
- **46elk**: ~$5-10 (beroende på SMS-volym)
- **Anthropic**: ~$5-20 (beroende på AI-anrop)

### Rekommenderade uppgraderingar
- **Vercel Pro**: $20/mån (mer bandwidth, längre cron jobs)
- **Neon Pro**: $10/mån (mer storage, bättre prestanda)

## 🔐 **Säkerhet**

### Viktiga säkerhetsåtgärder
- ✅ **ALDRIG** hårdkoda API-nycklar i koden
- ✅ Använd environment variables för alla känsliga data
- ✅ Rotera API-nycklar regelbundet
- ✅ Begränsa API-åtkomst till nödvändiga endpoints
- ✅ Övervaka API-användning för ovanlig aktivitet

### Environment Variables Checklist
- [ ] `ANTHROPIC_API_KEY` - Din Anthropic API-nyckel
- [ ] `NEON_DATABASE_URL` - Neon databas connection string
- [ ] `FORTYSIXELK_API_KEY` - 46elk SMS API-nyckel
- [ ] `FORTYSIXELK_SENDER` - SMS avsändarnamn
- [ ] `CRON_SECRET` - Hemlig nyckel för cron job säkerhet
- [ ] `NEXT_PUBLIC_BASE_URL` - Din applikations URL

## 📞 **Support**

Om du stöter på problem:
1. Kontrollera loggarna i Vercel dashboard
2. Verifiera alla environment variables
3. Testa lokalt först
4. Kontrollera API-nycklars giltighet

**Lycka till med ditt SMS-notifikationssystem! 🚀📱**
