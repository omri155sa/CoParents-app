import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { coupleAPI } from '../../services/api';

export const fetchCouple = createAsyncThunk('couple/fetch', async (coupleId, { rejectWithValue }) => {
  try {
    const res = await coupleAPI.get(coupleId);
    return res.data.couple;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const coupleSlice = createSlice({
  name: 'couple',
  initialState: {
    couple: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCouple: (state, action) => { state.couple = action.payload; },
    clearCouple: (state) => { state.couple = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCouple.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCouple.fulfilled, (state, action) => {
        state.loading = false;
        state.couple = action.payload;
      })
      .addCase(fetchCouple.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCouple, clearCouple } = coupleSlice.actions;
export default coupleSlice.reducer;
