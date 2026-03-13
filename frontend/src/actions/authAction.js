import { login, register } from "../reducer/authReducer";
import { showToast } from "../utils/toast";

export default async function authAction(prevState, formData, dispatch, navigate) {
  const mode = formData.get("mode");

  if (mode === "login") {
    const identifier = formData.get("userName");
    const password = formData.get("password");

    if (!identifier || !password) {
      showToast({ icon: "error", title: "Both fields are required" });
      return { success: false, message: "Both fields are required" };
    }

    const result = await dispatch(login({ identifier, password }));

    if (login.rejected.match(result)) {
      showToast({ icon: "error", title: result.payload?.message || "Login failed" });
      return { error: result.payload };
    }

    // Extract token and user data from the fulfilled action payload
    const { accessToken, user } = result.payload;

    // Store the access token exactly as expected by your frontend
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }

    // Route the user based on their specific role
    if (user?.role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }

    showToast({ icon: "success", title: "Login Successful!" });
    return { success: true };

  } else {
    const data = Object.fromEntries(formData.entries());
    const { name, userName, email, password, country, city, state, gender, pinCode } = data;

    const result = await dispatch(register({ name, userName, email, password, country, city, state, pinCode, gender }));

    if (register.rejected.match(result)) {
      showToast({ icon: "error", title: result.payload?.message || "Signup failed" });
      return { error: result.payload };
    }

    showToast({ icon: "success", title: "SignUp Successful!" });
    return { success: true };
  }
}