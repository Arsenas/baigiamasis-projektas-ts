# 🧠 Baigiamasis projektas – Real-Time Chat Platforma

Tai pilnai veikianti realaus laiko pokalbių platforma su galimybe registruotis, bendrauti 
viešame ir privačiame pokalbių kambaryje, valdyti dalyvius, trinti ir mėgti žinutes, bei turinio valdymu pagal vartotojo 
rolę. Projektas sukurtas naudojant **React (Create React App)** su **TypeScript**, **Tailwind CSS** stiliui, 
ir **Node.js/Express + MongoDB** backendui. Duomenų perdavimui realiu laiku naudojamas **Socket.IO**.

---

## 🚀 Paleidimas

### Priekinė dalis (frontend)

```bash
cd frontend
npm install
npm start
```

Frontend paleidžiamas adresu `http://localhost:3000`

### Serverio dalis (backend)

```bash
cd backend
npm install
npm run dev
```

Backend naudoja `.env` failą su MongoDB URL ir JWT slaptažodžiu.

---

## 📦 Projekto struktūra

```
baigiamasis-projektas-ts/
├── frontend/    # React + Tailwind, vartotojo sąsaja
└── backend/     # Express + MongoDB + Socket.io
```

---

## ✨ Projekto funkcionalumas

### Front-End pusė

- **Visi duomenys atvaizduojami pagal rolę** – matomi pokalbiai, žinutės, dalyviai. Galima matyti tik savo žinutes arba gauti platesnę prieigą, jei prisijungta kaip administratorius.
- **Registracija ir prisijungimas** – autentifikacija su slaptažodžio šifravimu, validacija ir token'ais.
- **Vartotojo profilio valdymas** – galima atnaujinti vartotojo informaciją.
- **Dizainas** – vientisas, mobiliai pritaikytas (responsive), naudojant Tailwind CSS.
- **Context'ai ir Reducer'iai** – naudojami bent du Context'ai (pvz., autentifikacijos ir socket ryšio), su atitinkamais reducer'iais aplikacijos valdymui.

### Back-End pusė

- **Duomenų modeliai** – naudojami keli skirtingi duomenų modeliai, tokie kaip vartotojai, pokalbiai, žinutės, dalyviai, rolės.
- **Duomenų ryšiai** – tarp modelių realizuoti santykiai, pvz., pokalbiai turi dalyvius, žinutės priklauso vartotojams ir pokalbiams.
- **Autorizacija** – skirtingi vartotojų lygiai (user/admin), su turinio apribojimais – paprasti vartotojai gali keisti tik savo duomenis, o administratoriai – visų.
- **Middleware logika** – tik vartotojas ar administratorius gali redaguoti ar trinti duomenis.
- **Realus laikas** – WebSocket ryšys su `socket.io` palaiko tiesioginį žinučių siuntimą, trynimą, mėgimą, dalyvių atnaujinimą.

---

## 🔧 Naudotos technologijos

### Front-End
- React (Create React App, TypeScript)
- Tailwind CSS
- Context API + useReducer
- Axios
- React Router

### Back-End
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT autentifikacija
- dotenv, bcrypt, middleware logika

---

## 📝 Pastabos

Projektas orientuotas ne tik į reikalavimų įvykdymą, bet ir į realų vartotojo patyrimą. Kodo struktūra logiška, atskirtos atsakomybės, komponentai bei API endpoint'ai. Kodo skaitymas ir testavimas turėtų būti sklandus dėka aiškių pavadinimų, aplankų struktūros ir dokumentacijos.
