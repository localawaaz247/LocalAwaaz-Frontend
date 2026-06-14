import { login, register } from "../reducer/authReducer";
import { showToast } from "../utils/toast";
import axiosInstance from "../utils/axios"; // Import your axios instance

export default async function authAction(prevState, formData, dispatch, navigate) {
  const mode = formData.get("mode");
  const data = Object.fromEntries(formData.entries());

  if (mode === "login") {
    const identifier = data.userName;
    const password = data.password;

    if (!identifier || !password) {
      showToast({ icon: "error", title: "Both fields are required" });
      return { success: false, message: "Both fields are required" };
    }

    const result = await dispatch(login({ identifier, password }));

    if (login.rejected.match(result)) {
      showToast({ icon: "error", title: result.payload?.message || "Login failed" });
      return { error: result.payload };
    }

    const { accessToken, user } = result.payload;

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }

    if (user?.role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }

    showToast({ icon: "success", title: "Login Successful!" });
    return { success: true };

  } else if (mode === "registerAuthority") {
    // ==========================================
    // AUTHORITY REGISTRATION
    // ==========================================
    try {
      if (data.expertiseTags) {
        data.expertiseTags = data.expertiseTags.split(',').map(tag => tag.trim());
      }

      // Add a dummy password to satisfy the backend bcrypt hash requirement.
      // They will reset this later via the email they receive.
      data.password = "PendingAuthPass123!";

      const response = await axiosInstance.post('/auth/register-authority', data);

      showToast({ icon: "success", title: "Application Submitted! Awaiting Admin Approval." });
      return { success: true, message: response.data.message };

    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed";
      showToast({ icon: "error", title: errorMsg });
      return { error: errorMsg, success: false };
    }
  }
}