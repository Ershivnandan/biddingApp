import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFGbS0W_Oi-fDciEIa5n8S_00yeW78Z5o",
  authDomain: "realtimebiddingapp.firebaseapp.com",
  projectId: "realtimebiddingapp",
  storageBucket: "realtimebiddingapp.appspot.com",
  messagingSenderId: "998431901990",
  appId: "1:998431901990:web:440df112e7d0c6e85759e7",
  measurementId: "G-FXEBWRPCRB",
};

function isTokenExpired(token) {
  if (!token) return true;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const expiry = payload.exp * 1000;
  const now = Date.now();

  return now > expiry;
}

const idToken = localStorage.getItem("idToken");

function checkLoggedin() {
  if (!idToken) {
    return;
  } else if (isTokenExpired(idToken)) {
    alert("Session expired. Please log in again.");
    localStorage.removeItem("idToken");
    localStorage.removeItem("refreshToken");
    window.location.href = 'login.html'
  } else {
    console.log(isTokenExpired(idToken));
    window.location.href = "landing.html";
  }
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("userEmail").value;
  const password = document.getElementById("userPass").value;

  const userData = {
    password: password,
    username: email,
  };

  registerUser(userData);
});

async function registerUser(userData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.username,
      userData.password
    );

    const token = await userCredential.user.getIdToken();
    localStorage.setItem("idToken", token);

    localStorage.setItem("refreshToken", userCredential.user.refreshToken);

    alert("Signup successful!");
    window.location.href = "login/login.html";
  } catch (err) {
    throw new Error(err.message);
  }
}

// Pahle check kar lete hai agar user pahle se login hai to direct dashboard me chaj denge
checkLoggedin();

