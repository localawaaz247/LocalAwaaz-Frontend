import axios from "axios";

export const cscApi = axios.create({
  baseURL: "https://api.countrystatecity.in/v1",
  headers: {
    "X-CSCAPI-KEY": import.meta.env.VITE_CSC_API_KEY
  }
});
