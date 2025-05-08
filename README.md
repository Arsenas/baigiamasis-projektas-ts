# 🧠 Baigiamasis projektas – Real-Time Chat Platforma

Tai pilnai veikianti realaus laiko pokalbių platforma, leidžianti registruotis, bendrauti viešame ir privačiame pokalbių kambaryje, valdyti dalyvius, trinti ir mėgti žinutes, bei riboti prieigą pagal vartotojo rolę. Projektas sukurtas naudojant **React + TypeScript (frontend)**, **Express + MongoDB (backend)** ir **Socket.IO** realaus laiko funkcionalumui.

---

## 🌐 Gyvai pasiekiama

🔗 https://baigiamasis-projektas-ts.vercel.app
    Admino prisijungimas: login: Admin
                          password: Admin1!
---

## 🚀 Paleidimas

### Frontend

```bash
cd frontend
npm install
npm start
```

Veikia lokaliai adresu: [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend
npm install
npm run dev
```

Reikia `.env` failo su šiais kintamaisiais:

```
MONGO_URL=...
JWT_SECRET=...
CLIENT_URL=http://localhost:3000
PORT=2000
```

---

## 📁 Projekto struktūra

```
baigiamasis-projektas-ts/
├── frontend/     # React, Tailwind CSS, Context API
└── backend/      # Express, Mongoose, Socket.IO
```

---

## ✨ Funkcionalumo santrauka

### Front-End

- ✅ Vartotojo registracija, prisijungimas, profilio valdymas
- ✅ Vieši ir privatūs pokalbiai
- ✅ Žinučių siuntimas, trynimas, mėgimas
- ✅ Realaus laiko veiksmai per Socket.IO
- ✅ Rolėmis paremta turinio prieiga (user/admin)
- ✅ Context API ir useReducer naudojimas (autentifikacija, socket)
- ✅ Responsyvus dizainas su Tailwind CSS

### Back-End

- ✅ 5+ duomenų modelių: Vartotojas, Pokalbis, Žinutė, Rolių schema ir kt.
- ✅ 4+ modelių tarpusavio ryšiai (pvz., žinutės priklauso pokalbiams ir vartotojams)
- ✅ JWT autentifikacija, bcrypt slaptažodžių šifravimas
- ✅ Middleware tikrina vartotojo teises (ar yra autorius/admin)
- ✅ Tik autorius arba admin gali keisti duomenis
- ✅ API endpoint’ai suskirstyti pagal atsakomybę (autentifikacija, pokalbiai, admin valdymas)

---

## 🔧 Naudotos technologijos

### Front-End

- React (Create React App, TypeScript)
- Tailwind CSS
- Context API + useReducer
- React Router
- Axios

### Back-End

- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JSON Web Tokens (JWT)
- bcrypt
- dotenv
- Custom middleware

---

## 📝 Pastabos

Projektas kurtas orientuojantis į aiškų funkcionalumą, realią naudotojo patirtį ir kodų skaidrumą:

- Kodo struktūra suskirstyta pagal atsakomybes (komponentai, context'ai, routeriai, kontroleriai).
- API keliai pavadinti nuosekliai ir intuityviai.
- Lengva testuoti, plėsti ar dokumentuoti.
- Naudotas sąmoningas komponentų suskaidymas ir teisių valdymas.
