import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFGbS0W_Oi-fDciEIa5n8S_00yeW78Z5o",
  authDomain: "realtimebiddingapp.firebaseapp.com",
  projectId: "realtimebiddingapp",
  storageBucket: "realtimebiddingapp.appspot.com",
  messagingSenderId: "998431901990",
  appId: "1:998431901990:web:440df112e7d0c6e85759e7",
  measurementId: "G-FXEBWRPCRB",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById("loginForm");

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
  } else {
    console.log(isTokenExpired(idToken));
    
    window.location.href = 'landing.html';
  }
}

async function fetchLogindetails(loginData) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      loginData.email,
      loginData.password
    );
    alert("Login Successfully!");

    const token = await userCredential.user.getIdToken();
    localStorage.setItem("idToken", token);

    localStorage.setItem("refreshToken", userCredential.user.refreshToken);

    
    window.location.href = 'landing.html';
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("userEmail").value;
  const password = document.getElementById("userPass").value;

  const loginData = {
    email: email,
    password: password,
    returnSecureToken: true,
  };

  fetchLogindetails(loginData);
});

checkLoggedin();
