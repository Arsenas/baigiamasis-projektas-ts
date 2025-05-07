import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Message } from "../types"; // ✅ IMPORT shared types

interface StoreState {
  currentUser: User | null;
  token: string;
  users: User[];
  conNum: number;
  grid: boolean;

  messages: Message[];

  // ✅ supports both: (fn) => ..., and array value
  setMessages: (val: Message[] | ((prev: Message[]) => Message[])) => void;

  removeMessage: (id: string) => void;

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

      messages: [],

      setMessages: (valOrFn) => {
        if (typeof valOrFn === "function") {
          set((state) => ({ messages: valOrFn(state.messages) }));
        } else {
          set({ messages: valOrFn });
        }
      },

      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg._id !== id),
        })),

      setGrid: (val) => set({ grid: val }),
      setToken: (val) => set({ token: val }),
      setCurrentUser: (val) => set({ currentUser: val }),
      setUsers: (val) => set({ users: val }),
      setConNum: (val) => set({ conNum: val }),
    }),
    {
      name: "main-store",
    }
  )
);

export default useStore;
