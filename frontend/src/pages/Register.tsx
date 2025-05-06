import React, { useEffect, useRef, useState } from "react";
import http from "../plugins/http";
import { useNavigate } from "react-router-dom";
import mainStore from "../store/mainStore";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";

// Komponentas skirtas vartotojo registracijai
const Register: React.FC = () => {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const nav = useNavigate();

  // Pranešimų būsena
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reikšmės įvesties laukeliams
  const nameRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const pass2Ref = useRef<HTMLInputElement>(null);

  // Validacijos regex
  const uppercaseRegex = /[A-Z]/;
  const specialCharRegex = /[!@#$%^&*_+]/;

  // Socket prijungimas
  useEffect(() => {
    const newSocket = io("http://localhost:2000");
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
    <div className="flex mt-[100px] flex-col justify-center lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Create an account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="space-y-6">
          {/* Username input */}
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
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                onKeyDown={(e) => {
                  if (e.key === "Enter") passRef.current?.focus();
                }}
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Password</label>
            <div className="mt-2">
              <input
                ref={passRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                onKeyDown={(e) => {
                  if (e.key === "Enter") pass2Ref.current?.focus();
                }}
              />
            </div>
          </div>

          {/* Repeat password */}
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Repeat password</label>
            <div className="mt-2">
              <input
                ref={pass2Ref}
                id="password2"
                name="password2"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                onKeyDown={(e) => {
                  if (e.key === "Enter") register();
                }}
              />
            </div>
          </div>

          {/* Klaidos pranešimas */}
          {errorMessage && <div className="text-sm text-red-500">{errorMessage}</div>}

          {/* Mygtukas registracijai */}
          <div>
            <button
              onClick={register}
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Linkas į login puslapį */}
        <p className="mt-10 text-center text-sm text-gray-500">
          Already a member?{" "}
          <span
            onClick={() => nav("/login")}
            className="font-semibold cursor-pointer leading-6 text-indigo-600 hover:text-indigo-500"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
