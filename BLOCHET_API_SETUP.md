# 🚀 Blocket API Setup Guide

## ⚠️ **VIKTIGT: Konfigurera Blocket API Token säkert!**

### ✅ **Vad som redan är fixat:**
- ❌ Hårdkodad Blocket token borttagen från `blocket_api/blocket.py`
- ✅ API-klassen använder nu `None` som standard för token
- ✅ Token måste skickas in när klassen instansieras

## 🔧 **Steg för att konfigurera Blocket API:**

### 1. **Skapa `.env` fil i root-mappen:**
```bash
# I root-mappen av projektet
echo "BLOCKET_API_TOKEN=din-blocket-token-här" > .env
```

### 2. **Uppdatera `blocket_api/blocket.py` för att läsa från environment:**
```python
import os
from dotenv import load_dotenv

# Ladda environment variables
load_dotenv()

@dataclass
class BlocketAPI:
    token: str | None = os.getenv('BLOCKET_API_TOKEN')
```

### 3. **Eller skicka token direkt när du använder klassen:**
```python
from blocket_api import BlocketAPI

# Skapa instans med din token
api = BlocketAPI(token="din-blocket-token-här")

# Eller från environment variable
import os
api = BlocketAPI(token=os.getenv('BLOCKET_API_TOKEN'))
```

## 🧪 **Testa Blocket API:**

### **Lokalt test:**
```bash
cd blocket_api
python -c "
from blocket import BlocketAPI
import os
from dotenv import load_dotenv

load_dotenv()
api = BlocketAPI(token=os.getenv('BLOCKET_API_TOKEN'))
print('Token loaded:', api.token is not None)
"
```

### **Med monitor script:**
```bash
# Uppdatera monitor_bevakningar.py för att läsa från environment
python monitor_bevakningar.py
```

## 🔐 **Säkerhet:**

### **Viktigt att komma ihåg:**
- ✅ **ALDRIG** committa `.env` filen till GitHub
- ✅ **ALDRIG** hårdkoda tokens i koden
- ✅ Använd environment variables för alla känsliga data
- ✅ `.env` är redan i `.gitignore`

### **Environment Variables Checklist:**
- [ ] `BLOCKET_API_TOKEN` - Din Blocket API token
- [ ] `.env` fil skapad i root-mappen
- [ ] `.env` fil innehåller rätt token
- [ ] Token fungerar med API-anrop

## 📝 **Exempel på .env fil:**
```env
# Blocket API Configuration
BLOCKET_API_TOKEN=a64796eff46a02da517d32e4d1fd72aa7aaea1ae

# Andra environment variables kan läggas till här
```

## 🚀 **Live Deployment:**

### **För Vercel deployment:**
1. **Lägg till environment variable** i Vercel dashboard
2. **Namn**: `BLOCKET_API_TOKEN`
3. **Värde**: Din Blocket API token
4. **Miljö**: Production, Preview, Development

### **För lokal utveckling:**
1. **Skapa `.env` fil** i root-mappen
2. **Lägg till din token**
3. **Testa att API:et fungerar**

## 🔍 **Verifiera att allt fungerar:**

```bash
# Testa att token laddas korrekt
python -c "
from blocket_api import BlocketAPI
import os
from dotenv import load_dotenv

load_dotenv()
api = BlocketAPI()
print('Token loaded:', api.token is not None)
print('Token starts with:', api.token[:10] if api.token else 'None')
"
```

## 📞 **Om något går fel:**

1. **Kontrollera att `.env` filen finns** i root-mappen
2. **Verifiera att token är korrekt** kopierad
3. **Kontrollera att `python-dotenv` är installerat**
4. **Testa att environment variable laddas**

---

**Din Blocket API är nu säkert konfigurerad! 🚀🔐**
