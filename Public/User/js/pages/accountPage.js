export async function initAccountPage() {

  const token = localStorage.getItem("token");

  // If user not logged in → redirect to login
  if (!token) {
    console.log("User not logged in");
    window.location.href = "login.html";
    return;
  }

  try {

    const res = await fetch("http://localhost:4000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error("Failed to get user");
      return;
    }

    const user = data.user;

    const nameInput = document.getElementById("firstName");
    const emailInput = document.getElementById("email");

    if (nameInput) nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";

  } catch (error) {
    console.error("Failed to load user:", error);
  }

}