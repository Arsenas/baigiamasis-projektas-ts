import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  _id: string;
  username: string;
  image: string;
}

interface StoreState {
  currentUser: User | null;
  token: string;
  users: User[];
  conNum: number;
  grid: boolean;
  setGrid: (val: boolean) => void;
  setToken: (val: string) => void;
  setCurrentUser: (val: User | null) => void;
  setUsers: (val: User[]) => void;
  setConNum: (val: number) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      token: "",
      users: [],
      conNum: 0,
      grid: false,
      setGrid: (val) => set({ grid: val }),
      setToken: (val) => set({ token: val }),
      setCurrentUser: (val) => set({ currentUser: val }),
      setUsers: (val) => set({ users: val }),
      setConNum: (val) => set({ conNum: val }),
    }),
    {
      name: "main-store", // LocalStorage key
    }
  )
);

export default useStore;
