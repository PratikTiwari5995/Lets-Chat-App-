import { create } from 'zustand';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export const useUserStore = create((set) => ({
  currentUser: null,  // Changed from currentuser to currentUser for consistency
  isLoading: true,

  fetchUserInfo: async (uid) => {  // Changed fetchUser to fetchUserInfo for consistency
    if (!uid) {
      return set({ currentUser: null, isLoading: false });
    }

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      set({ currentUser: null, isLoading: false });
    }
  },
}));

export default useUserStore;
