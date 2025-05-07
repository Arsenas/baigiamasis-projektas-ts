import React, { useRef, useState } from "react";
import http from "../plugins/http";
import { useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import { useLanguage } from "../context/LanguageContext";

const Login: React.FC = () => {
  const nav = useNavigate();
  const { lang } = useLanguage();
  const { setCurrentUser, setToken } = mainStore();

  const nameRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function login() {
    setErrorMessage(null);

    const username = nameRef.current?.value || "";
    const password = passRef.current?.value || "";

    if (username.length < 1 || password.length < 1) {
      setErrorMessage(lang === "lt" ? "Užpildyk abu laukus." : "Please fill up both fields.");
      return;
    }

    const user = { username, password };
    const res = await http.postAuth("/login", user);

    if (res.error) {
      setErrorMessage(res.message ?? null);
    } else {
      setCurrentUser(res.updatedUser);
      if (res.token) setToken(res.token);
      nav("/");
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex justify-center items-center px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl mx-4 px-8 py-10">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
          {lang === "lt" ? "Prisijunk prie paskyros" : "Sign in to your account"}
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {lang === "lt" ? "Vartotojo vardas" : "Username"}
            </label>
            <input
              ref={nameRef}
              type="text"
              autoComplete="username"
              required
              className="mt-1 block w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") passRef.current?.focus();
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {lang === "lt" ? "Slaptažodis" : "Password"}
            </label>
            <input
              ref={passRef}
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />
          </div>

          {errorMessage && <div className="text-sm text-red-500">{errorMessage}</div>}

          <button
            onClick={login}
            type="submit"
            className="w-full flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {lang === "lt" ? "Prisijungti" : "Sign in"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            {lang === "lt" ? "Nesi narys?" : "Not a member?"}{" "}
            <span
              onClick={() => nav("/register")}
              className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-500"
            >
              {lang === "lt" ? "Registruotis" : "Register"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
