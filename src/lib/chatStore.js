import { create } from 'zustand';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import {useUserStore} from '../lib/userStore'
export const useChatStore = create((set) => ({
  chatId: null,  
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  
  // changeChat method
  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;  // Use `get()` to access the current state

    if (user?.blocked?.includes(currentUser.id)) {
      return set({
        chatId, 
        user: null,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
    } else if (currentUser?.blocked?.includes(user.id)) {
      return set({
        chatId, 
        user: user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
    } else {
      return set({
        chatId, 
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },

  // changeBlock method
  changeBlock: () => {
    set(state => ({ 
      ...state, 
      isReceiverBlocked: !state.isReceiverBlocked 
    }));
  },
}));




// import { create } from 'zustand';
// import { db } from './firebase';
// import { doc, getDoc } from 'firebase/firestore';

// export const useChatStore = create((set) => ({
//   chatId: null,  // Changed from currentuser to currentUser for consistency
//   user: null,
//   isCurrentUserBlocked: false,
//   isReceiverBlocked: false,
//   changeChat: (chatId, user)=>{
//     const currentUser = useChatStore.getState().currentUser;

//     if(user.blocked.includes(currentUser.id)){
//       return set({
//         chatId, 
//         user: null,
//         isCurrentUserBlocked: true,
//         isReceiverBlocked: false,

//       });
//     }

//    else if(currentUser.blocked.includes(user.id)){
//       return set({
//         chatId, 
//         user: user,
//         isCurrentUserBlocked: false,
//         isReceiverBlocked: true,

//       });
//   } else {
//   return set({
//     chatId, 
//     user,
//     isCurrentUserBlocked: false,
//     isReceiverBlocked: false,

//   });
// }
// },
//   changeBlock:() => {
//     set(state =>({...state, isReceiverBlocked: !state. isReceiverBlocked}));
//   },
// }));
