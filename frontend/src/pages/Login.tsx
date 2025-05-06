import React, { useRef, useState } from "react";
import http from "../plugins/http";
import { useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";

// Komponentas skirtas vartotojo prisijungimui
const Login: React.FC = () => {
  const nav = useNavigate();

  // Prisijungusio vartotojo būsena iš globalios parduotuvės
  const { currentUser, token, setCurrentUser, setToken } = mainStore();

  // Įvesties laukai naudojant useRef
  const nameRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  // Klaidos pranešimo būsena
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Funkcija prisijungimui
  async function login() {
    setErrorMessage(null);

    const username = nameRef.current?.value || "";
    const password = passRef.current?.value || "";

    if (username.length < 1 || password.length < 1) {
      setErrorMessage("Please fill up both fields.");
      return;
    }

    const user = { username, password };

    const res = await http.postAuth("/auth/login", user);
    console.log("RES:", res);

    if (res.error) {
      setErrorMessage(res.message ?? null);
      console.log(res.message);
    } else {
      console.log("RESPONSE:", res.data);
      setCurrentUser(res.data.user); // Išsaugom userį į store
      setToken(res.data.token); // Išsaugom tokeną į store
      nav("/"); // Naviguojam į homepage
    }
  }

  return (
    <div className="flex flex-col justify-center items-center mt-[100px] px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="space-y-6">
          {/* Username laukas */}
          <div>
            <label className="text-start block text-sm font-medium leading-6 text-gray-900">Username</label>
            <div className="mt-2">
              <input
                ref={nameRef}
                id="email"
                name="email"
                type="text"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Slaptažodžio laukas */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Password
            </label>
            <div className="mt-2">
              <input
                ref={passRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Mygtukas prisijungimui */}
          <div>
            <button
              onClick={login}
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500"
            >
              Sign in
            </button>
          </div>

          {/* Klaidos pranešimas jei yra */}
          {errorMessage && <div className="text-sm text-red-500">{errorMessage}</div>}
        </div>

        {/* Linkas į registraciją */}
        <p className="mt-10 text-center text-sm text-gray-500">
          Not a member?{" "}
          <span
            onClick={() => nav("/register")}
            className="font-semibold cursor-pointer leading-6 text-indigo-600 hover:text-indigo-500"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
