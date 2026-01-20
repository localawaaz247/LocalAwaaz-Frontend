import Swal from "sweetalert2";

export const showToast = ({
  icon = "success",
  title = "",
  position = "top-end",
  timer = 3500,
}) => {
  Swal.fire({
    toast: true,
    position,
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
};
