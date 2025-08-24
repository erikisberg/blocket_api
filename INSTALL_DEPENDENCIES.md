# 📦 Installera Dependencies

## 🚀 **Efter att du klonat projektet:**

### **1. Installera Node.js dependencies:**
```bash
cd frontend
npm install
```

### **2. Installera Python dependencies:**
```bash
cd ..
pip install -r requirements.txt
# Eller om du använder poetry:
poetry install
```

## 🔧 **Vad som händer:**

- **`npm install`** skapar `node_modules/` (464MB) - **ALDRIG committa!**
- **`npm run build`** skapar `.next/` (195MB) - **ALDRIG committa!**
- **`pip install`** installerar Python-paket

## 📁 **Filer som skapas automatiskt:**

### **Node.js (frontend/):**
- `node_modules/` - Dependencies (464MB)
- `.next/` - Build output (195MB)
- `package-lock.json` - Dependency lock (committa denna!)

### **Python (root):**
- `__pycache__/` - Python cache
- `*.pyc` - Kompilerade Python-filer
- `venv/` eller `env/` - Virtual environment

## 🚨 **Viktigt att komma ihåg:**

- ✅ **COMMITTA**: `package.json`, `package-lock.json`, `requirements.txt`
- ❌ **ALDRIG COMMITTA**: `node_modules/`, `.next/`, `__pycache__/`, `.env`

## 🔍 **Verifiera att allt fungerar:**

```bash
# Testa frontend
cd frontend
npm run dev

# Testa Python
cd ..
python -c "from blocket_api import BlocketAPI; print('✅ Python dependencies fungerar')"
```

## 📝 **Om du får fel:**

### **Node.js fel:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### **Python fel:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

**Dependencies installeras automatiskt när du kör kommandona ovan! 🚀**
