import Swal from "sweetalert2";

export const showToast = ({
  icon = "success",
  title = "",
  position = "top-end",
  timer = 1500,
}) => {
  Swal.fire({
    toast: true,
    position,
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
     background: "linear-gradient(90deg, #0a244a, #0a505e, #095c47)",
     color: "#ffffff",
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
};
