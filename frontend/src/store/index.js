import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import coupleReducer from './slices/coupleSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    couple: coupleReducer,
  },
});
