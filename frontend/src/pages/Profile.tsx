import React, { useEffect, useRef, useState } from "react";
import mainStore from "../store/mainStore";
import http from "../plugins/http";
import socket from "../socket";
import type { Socket } from "socket.io-client";
import ErrorComp from "../components/ErrorComp";
import SuccessComp from "../components/SuccessComp";

const Profile: React.FC = () => {
  const { currentUser, setCurrentUser, token } = mainStore();
  const imageRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);
  const newPass2Ref = useRef<HTMLInputElement>(null);

  const [changePassState, setChangePassState] = useState<number>(0);
  const [deleteAccState, setDeleteAccState] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorMsg2, setErrorMsg2] = useState<string | null>(null);
  const [errorMsg3, setErrorMsg3] = useState<string | null>(null);
  const [errorMsg4, setErrorMsg4] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [successMsg2, setSuccessMsg2] = useState<string | null>(null);
  const [successMsg3, setSuccessMsg3] = useState<string | null>(null);
  const [successMsg4, setSuccessMsg4] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function changeImage() {
    if (!imageRef.current || !currentUser) return;
    const data = {
      imageUrl: imageRef.current.value,
      userID: currentUser._id,
    };
    const res = await http.postAuth("/change-image", data, token);
    if (!res.error) {
      setCurrentUser(res.user);
      setSuccessMsg(res.message ?? null);
      setTimeout(() => setSuccessMsg(null), 3000);
      socket?.emit("profileUpdated", {
        userId: currentUser._id,
        image: res.user.image,
      });
    } else {
      setErrorMsg(res.message ?? null);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  }

  async function changeUsername() {
    if (!usernameRef.current || !currentUser) return;
    const data = {
      username: usernameRef.current.value,
      userID: currentUser._id,
    };
    const res = await http.postAuth("/change-username", data, token);
    if (!res.error) {
      setCurrentUser(res.user);
      setSuccessMsg2(res.message ?? null);
      setTimeout(() => setSuccessMsg2(null), 3000);
    } else {
      setErrorMsg2(res.message ?? null);
      setTimeout(() => setErrorMsg2(null), 3000);
    }
  }

  async function checkCurrentPassword(num: number) {
    if (!passRef.current || !currentUser) return;
    const data = {
      password: passRef.current.value,
      username: currentUser.username,
    };
    const res = await http.postAuth("/login", data, token);
    if (res.success) {
      if (num === 1) setChangePassState(2);
      if (num === 2) setDeleteAccState(2);
    } else {
      if (num === 1) setErrorMsg3(res.message ?? null);
      if (num === 2) setErrorMsg4(res.message ?? null);
      setTimeout(() => setErrorMsg3(null), 3000);
    }
  }

  async function changePassword() {
    if (!newPassRef.current || !newPass2Ref.current || !currentUser) return;
    setErrorMsg3(null);
    setSuccessMsg3(null);
    const uppercaseRegex = /[A-Z]/;
    const specialCharRegex = /[!@#$%^&*_+]/;
    setError(null);

    const pass1 = newPassRef.current.value;
    const pass2 = newPass2Ref.current.value;

    if (pass1 !== pass2) return setErrorMsg3("Passwords do not match");
    if (pass1.length < 1) return setErrorMsg3("Please enter your new password");
    if (pass1.length > 20 || pass1.length < 4)
      return setErrorMsg3("Password cannot be shorter than 4 characters or longer than 20 characters.");
    if (!uppercaseRegex.test(pass1)) return setErrorMsg3("Password must contain at least one uppercase letter.");
    if (!specialCharRegex.test(pass1))
      return setErrorMsg3("Password must contain at least one special character (!@#$%^&*_+).");

    const data = {
      password: pass1,
      passwordTwo: pass2,
      username: currentUser.username,
      userID: currentUser._id,
    };
    const res = await http.postAuth("/change-password", data, token);
    if (!res.error) {
      setChangePassState(0);
      setSuccessMsg3(res.message ?? null);
      setTimeout(() => setSuccessMsg3(null), 3000);
    } else {
      setErrorMsg3(res.message ?? null);
    }
  }

  async function deleteAcc() {
    if (!currentUser) return;
    const data = { userID: currentUser._id };
    const res = await http.postAuth("/delete-account", data, token);
    if (!res.error) {
      socket?.emit("deletedAcc", res.data);
      setCurrentUser(null);
      window.location.href = "/login";
    } else {
      console.log(res.message);
    }
  }

  return (
    <div className="lg:container mx-auto p-5">
      <div className=" mx-[50px] flex gap-4">
        <div className="flex flex-col w-[500px] shadow-xl">
          <div className="flex flex-col h-[200px] bg-gradient-to-r from-indigo-500 to-violet-400 w-full rounded"></div>
          <div className="flex flex-col h-[550px] bg-white w-full relative rounded">
            <div className="w-[180px] h-[180px] absolute -top-16 right-1/2 transform translate-x-1/2 rounded-full flex justify-center items-center">
              <div className="absolute inset-0  rounded-full backdrop-blur  "></div>
              <img src={currentUser?.image} className="w-[160px] h-[160px] rounded-full relative z-10" alt="Profile" />
            </div>
            <div className="mt-[130px] font-semibold text-xl">{currentUser?.username}</div>
          </div>
        </div>
        <div className="flex flex-col w-full shadow-xl bg-white rounded-2xl overflow-hidden text-start">
          <div className="flex bg-gradient-to-r to-indigo-500 from-violet-400 p-3">
            <p className="text-white font-semibold text-lg">Edit profile</p>
          </div>

          <div className="flex flex-col justify-between h-full p-6">
            <div className="">
              <div className="mt-10  flex flex-col gap-1">
                <label htmlFor="image" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Profile picture
                </label>
                <div className="lg:flex-row flex flex-col gap-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      id="image"
                      ref={imageRef}
                      className="lg:w-[300px] w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      defaultValue={currentUser?.image}
                      required
                    />
                  </div>
                  <button
                    onClick={changeImage}
                    className="flex lg:w-[200px] w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Save
                  </button>
                </div>
                {errorMsg && <ErrorComp error={errorMsg} />}
                {successMsg && <SuccessComp msg={successMsg} />}
              </div>
              <div className="mt-10 flex flex-col gap-2">
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Username
                </label>
                <div className="lg:flex-row flex flex-col gap-3">
                  <input
                    type="text"
                    id="username"
                    ref={usernameRef}
                    className="lg:w-[300px] w-full  bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    defaultValue={currentUser?.username}
                    required
                  />
                  <button
                    onClick={changeUsername}
                    className="flex lg:w-[200px] w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Save
                  </button>
                </div>
                {errorMsg2 && <ErrorComp error={errorMsg2} />}
                {successMsg2 && <SuccessComp msg={successMsg2} />}
              </div>
              {changePassState === 0 && (
                <div className="mt-10">
                  <button
                    onClick={() => setChangePassState(1)}
                    className="flex mb-3 lg:w-[300px] w-full justify-center rounded-md bg-indigo-600 px-6 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Change password
                  </button>
                  {errorMsg3 && <ErrorComp error={errorMsg3} />}
                  {successMsg3 && <SuccessComp msg={successMsg3} />}
                </div>
              )}
              {changePassState === 1 && (
                <div className="mt-10 flex flex-col gap-3">
                  <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Enter your current password
                  </label>
                  <input
                    type="password"
                    id="password"
                    ref={passRef}
                    className="w-[300px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder={`password`}
                    required
                  />
                  <button
                    onClick={() => checkCurrentPassword(1)}
                    className="flex w-[300px] justify-center rounded-md bg-indigo-600 px-6 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Enter
                  </button>
                  {errorMsg3 && <ErrorComp error={errorMsg3} />}
                  {successMsg3 && <SuccessComp msg={successMsg3} />}
                </div>
              )}
              {changePassState === 2 && (
                <div className="mt-10 flex flex-col gap-3">
                  <label htmlFor="password2" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Enter new password
                  </label>
                  <input
                    type="password"
                    id="password2"
                    ref={newPassRef}
                    className="w-[300px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder={`password`}
                    required
                  />
                  <input
                    type="password"
                    id="password"
                    ref={newPass2Ref}
                    className="w-[300px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder={`repeat password`}
                    required
                  />
                  {error && error}
                  <div className="flex gap-3">
                    <button
                      onClick={changePassword}
                      className="flex w-[150px] justify-center rounded-md bg-indigo-600 px-6 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Change
                    </button>
                    <button
                      onClick={() => setChangePassState(0)}
                      className="flex w-[150px] justify-center rounded-md bg-indigo-600 px-6 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Cancel
                    </button>
                  </div>
                  {errorMsg3 && <ErrorComp error={errorMsg3} />}
                  {successMsg3 && <SuccessComp msg={successMsg3} />}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full mb-8 p-5">
            {deleteAccState === 0 && (
              <div className="mt-10">
                <button
                  onClick={() => setDeleteAccState(1)}
                  className="text-white w-[250px] bg-indigo-700 hover:bg-indigo-600  font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                >
                  Delete account
                </button>
              </div>
            )}
            {deleteAccState === 1 && (
              <div className="mt-10 flex flex-col gap-3 justify-center">
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Enter your current password
                </label>
                <input
                  type="password"
                  id="password"
                  ref={passRef}
                  className="w-[300px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder={`password`}
                  required
                />
                <button
                  onClick={() => checkCurrentPassword(2)}
                  className="flex  justify-center rounded-md bg-indigo-600 px-6 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Enter
                </button>
                {errorMsg4 && <ErrorComp error={errorMsg4} />}
              </div>
            )}
            {deleteAccState === 2 && (
              <div className="flex flex-col gap-3 text-gray-800">
                <p>Are you sure u want to delete your account?</p>
                <div className="lg:flex-row flex flex-col gap-3">
                  <button
                    onClick={() => setDeleteAccState(0)}
                    className="text-white lg:w-[250px] w-full bg-violet-600 hover:bg-violet-500 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                  >
                    Go back
                  </button>
                  <button
                    onClick={deleteAcc}
                    className="text-white lg:w-[250px] w-full bg-indigo-600 hover:bg-indigo-500 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
