import React, { useEffect, useRef, useState } from "react";
import http from "../plugins/http";
import { useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

// Komponentas skirtas vartotojo registracijai
const Register: React.FC = () => {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const nav = useNavigate();
  const { lang } = useLanguage();

  // Pranešimų būsena
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reikšmės įvesties laukeliams
  const nameRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const pass2Ref = useRef<HTMLInputElement>(null);

  //Dark mode
  const { theme } = useTheme();

  // Validacijos regex
  const uppercaseRegex = /[A-Z]/;
  const specialCharRegex = /[!@#$%^&*_+]/;

  // Socket prijungimas
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || "");
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Registracijos funkcija
  async function register() {
    try {
      validate();

      const user = {
        username: nameRef.current?.value || "",
        password: passRef.current?.value || "",
        passwordTwo: pass2Ref.current?.value || "",
      };

      const res = await http.postAuth("/register", user);
      console.log(user);

      if (res && res.error) {
        setErrorMessage(res.message || "An error occurred during registration.");
        console.log(res.message);
      } else if (res) {
        const users = res.data;
        socket?.emit("registeredUsers", users);
        nav("/login");
      } else {
        setErrorMessage("Unexpected response from the server.");
        console.log("Response is undefined or doesn't contain the expected data.");
      }
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
      console.error("Error during registration:", error);
    }
  }

  // Formos validacija prieš siunčiant
  function validate() {
    const username = nameRef.current?.value || "";
    const password = passRef.current?.value || "";
    const passwordTwo = pass2Ref.current?.value || "";

    setErrorMessage(null);

    if (username.length > 20 || username.length < 4) {
      setErrorMessage("Username must be 4–20 characters.");
      return;
    }

    if (password.length > 20 || password.length < 4) {
      setErrorMessage("Password must be 4–20 characters.");
      return;
    }

    if (password !== passwordTwo) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!uppercaseRegex.test(password)) {
      setErrorMessage("Password must contain at least one uppercase letter.");
      return;
    }

    if (!specialCharRegex.test(password)) {
      setErrorMessage("Password must contain at least one special character.");
      return;
    }

    console.log("Form passed validation");
  }

  return (
    <div className="relative min-h-[calc(100vh-64px-90px)] flex justify-center items-center px-4 py-8">
      {/* 🧾 White card container */}
      <div className="w-full max-w-xl bg-white/85 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl mx-4 sm:mx-auto px-8 py-10">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">Create an account</h2>

        <div className="space-y-6">
          {/* Username input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
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

          {/* Password input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              ref={passRef}
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") pass2Ref.current?.focus();
              }}
            />
          </div>

          {/* Repeat password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Repeat password</label>
            <input
              ref={pass2Ref}
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") register();
              }}
            />
          </div>

          {/* Error message */}
          {errorMessage && <div className="text-sm text-red-500">{errorMessage}</div>}

          {/* Sign up button */}
          <button
            onClick={register}
            type="submit"
            className={`w-full flex justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${
              theme === "dark"
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            Sign up
          </button>

          {/* Login redirect */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already a member?{" "}
            <span
              onClick={() => nav("/login")}
              className={`font-semibold cursor-pointer transition ${
                theme === "dark" ? "text-gray-800 hover:text-gray-700" : "text-indigo-600 hover:text-indigo-500"
              }`}
            >
              {lang === "lt" ? "Prisijungti" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
