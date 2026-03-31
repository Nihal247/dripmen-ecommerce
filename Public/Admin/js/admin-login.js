async function adminLogin(event) {

  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const res = await fetch("http://localhost:4000/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {

localStorage.setItem("token", data.token);

      window.location.href = "admin.html";

    } else {

      alert(data.message);

    }

  } catch (error) {

    console.error(error);
    alert("Login failed");

  }
}