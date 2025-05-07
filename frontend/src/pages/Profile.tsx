import React, { useRef, useState } from "react";
import mainStore from "../store/mainStore";
import http from "../plugins/http";
import socket from "../socket";
import ErrorComp from "../components/ErrorComp";
import SuccessComp from "../components/SuccessComp";
import Modal from "../components/Modal";
import { useTheme } from "../context/ThemeContext";

const Profile: React.FC = () => {
  const { currentUser, setCurrentUser, token } = mainStore();
  const imageRef = useRef<HTMLInputElement>(null!);
  const usernameRef = useRef<HTMLInputElement>(null!);
  const wallpaperRef = useRef<HTMLInputElement>(null!);
  const descriptionRef = useRef<HTMLInputElement>(null!);
  const passRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);
  const newPass2Ref = useRef<HTMLInputElement>(null);

  const [showPassModal, setShowPassModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg3, setErrorMsg3] = useState<string | null>(null);
  const [errorMsg4, setErrorMsg4] = useState<string | null>(null);
  const [successMsg3, setSuccessMsg3] = useState<string | null>(null);
  const { theme } = useTheme();

  async function updateField(field: string, value: string) {
    const res = await http.postAuth("/update-user-fields", { [field]: value }, token);
    if (!res.error && res.updatedUser) {
      setCurrentUser(res.updatedUser);
      socket?.emit("profileUpdated", res.updatedUser);
      setSuccessMsg(`${field} updated successfully.`);
    } else {
      setErrorMsg(res.message ?? `Failed to update ${field}`);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 3000);
  }

  async function checkCurrentPassword(num: number) {
    if (!passRef.current || !currentUser) return;
    const res = await http.postAuth(
      "/login",
      {
        password: passRef.current.value,
        username: currentUser.username,
      },
      token
    );
    if (!res.success) {
      num === 1
        ? setErrorMsg3(res.message ?? "Something went wrong")
        : setErrorMsg4(res.message ?? "Something went wrong");

      setTimeout(() => {
        setErrorMsg3(null);
        setErrorMsg4(null);
      }, 3000);
    } else {
      num === 1
        ? setErrorMsg3(res.message ?? "Something went wrong")
        : setErrorMsg4(res.message ?? "Something went wrong");

      setTimeout(() => {
        setErrorMsg3(null);
        setErrorMsg4(null);
      }, 3000);
    }
  }

  async function changePassword() {
    if (!newPassRef.current || !newPass2Ref.current || !currentUser) return;
    const pass1 = newPassRef.current.value;
    const pass2 = newPass2Ref.current.value;

    if (pass1 !== pass2) return setErrorMsg3("Passwords do not match");
    if (pass1.length < 4 || pass1.length > 20) return setErrorMsg3("Password length invalid");
    if (!/[A-Z]/.test(pass1)) return setErrorMsg3("Password needs uppercase");
    if (!/[!@#$%^&*_+]/.test(pass1)) return setErrorMsg3("Password needs special character");

    const res = await http.postAuth(
      "/change-password",
      {
        password: pass1,
        passwordTwo: pass2,
        username: currentUser.username,
        userID: currentUser._id,
      },
      token
    );
    if (!res.error) {
      setSuccessMsg3(res.message ?? null);
    } else {
      setErrorMsg3(res.message ?? "Change failed");
    }
  }

  async function deleteAcc() {
    if (!currentUser) return;
    const res = await http.postAuth("/delete-account", { userID: currentUser._id }, token);
    if (!res.error) {
      socket?.emit("deletedAcc", res.data);
      setCurrentUser(null);
      window.location.href = "/login";
    }
  }

  return (
    <>
      <div className="flex justify-center mt-12 px-4">
        <div className="w-full max-w-[1400px] min-h-[700px] flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* LEFT COLUMN */}
          <div className="w-full md:w-[400px] bg-gray-100">
            <div
              className="h-[200px] bg-cover bg-center"
              style={{ backgroundImage: `url(${currentUser?.wallpaper})` }}
            />
            <div className="flex flex-col items-center -mt-16">
              <img
                src={currentUser?.image}
                className="w-[120px] h-[120px] object-cover rounded-full border-4 border-white shadow-md"
                alt="Profile"
              />
              <h2 className="text-xl font-semibold text-gray-800 mt-3">{currentUser?.username}</h2>
              <p className="text-sm text-gray-600 px-6 text-center mt-2">
                {currentUser?.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 p-8 space-y-6">
            <h2
              className={`text-xl font-bold px-6 py-3 rounded-t-2xl ${
                theme === "dark"
                  ? "bg-gradient-to-r from-gray-800 to-indigo-900 text-white"
                  : "bg-indigo-500 text-white"
              }`}
            >
              Edit Profile
            </h2>

            {/* GRID OF FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Profile Picture URL"
                refObj={imageRef}
                defaultValue={currentUser?.image}
                onSave={() => updateField("image", imageRef.current?.value || "")}
              />
              <Field
                label="Username"
                refObj={usernameRef}
                defaultValue={currentUser?.username}
                onSave={() => updateField("username", usernameRef.current?.value || "")}
              />
              <Field
                label="Wallpaper Picture URL"
                refObj={wallpaperRef}
                defaultValue={currentUser?.wallpaper}
                onSave={() => updateField("wallpaper", wallpaperRef.current?.value || "")}
              />
              <Field
                label="Description"
                refObj={descriptionRef}
                defaultValue={currentUser?.description}
                onSave={() => updateField("description", descriptionRef.current?.value || "")}
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button
                onClick={() => setShowPassModal(true)}
                className={`${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                } px-6 py-2 rounded-full text-sm font-semibold transition`}
              >
                Change Password
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold"
              >
                Delete Account
              </button>
            </div>

            {errorMsg && <ErrorComp error={errorMsg} />}
            {successMsg && <SuccessComp msg={successMsg} />}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal isOpen={showPassModal} title="Change Password" onClose={() => setShowPassModal(false)}>
        <input
          type="password"
          ref={passRef}
          placeholder="Current Password"
          className="w-full p-2 mb-2 border rounded-lg"
        />
        <input
          type="password"
          ref={newPassRef}
          placeholder="New Password"
          className="w-full p-2 mb-2 border rounded-lg"
        />
        <input
          type="password"
          ref={newPass2Ref}
          placeholder="Repeat New Password"
          className="w-full p-2 mb-4 border rounded-lg"
        />
        {errorMsg3 && <ErrorComp error={errorMsg3} />}
        {successMsg3 && <SuccessComp msg={successMsg3} />}
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowPassModal(false)} className="bg-gray-300 px-4 py-2 rounded-lg text-sm">
            Cancel
          </button>
          <button
            onClick={() => {
              checkCurrentPassword(1).then(() => {
                changePassword();
                setShowPassModal(false);
              });
            }}
            className={`${
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            } px-4 py-2 rounded-lg text-sm font-semibold transition`}
          >
            Confirm
          </button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={showDeleteModal} title="Confirm Deletion" onClose={() => setShowDeleteModal(false)}>
        <input
          type="password"
          ref={passRef}
          placeholder="Enter password to confirm"
          className="w-full p-2 mb-4 border rounded-lg"
        />
        {errorMsg4 && <ErrorComp error={errorMsg4} />}
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDeleteModal(false)} className="bg-gray-300 px-4 py-2 rounded-lg text-sm">
            Cancel
          </button>
          <button
            onClick={() => {
              checkCurrentPassword(2).then(() => {
                deleteAcc();
                setShowDeleteModal(false);
              });
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
};

const Field = ({
  label,
  refObj,
  defaultValue,
  onSave,
}: {
  label: string;
  refObj: React.RefObject<HTMLInputElement>;
  defaultValue?: string;
  onSave: () => void;
}) => {
  const { theme } = useTheme(); // ✅ Hook to access theme

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2 mt-1">
        <input ref={refObj} type="text" defaultValue={defaultValue} className="flex-1 p-2 border rounded-lg text-sm" />
        <button
          onClick={onSave}
          className={`${
            theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-indigo-500 hover:bg-indigo-400 text-white"
          } px-4 py-2 rounded-md text-sm font-semibold transition`}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Profile;
