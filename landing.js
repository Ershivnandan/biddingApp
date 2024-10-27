// firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  child,
  onValue,
  update,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFGbS0W_Oi-fDciEIa5n8S_00yeW78Z5o",
  authDomain: "realtimebiddingapp.firebaseapp.com",
  projectId: "realtimebiddingapp",
  storageBucket: "realtimebiddingapp.appspot.com",
  messagingSenderId: "998431901990",
  appId: "1:998431901990:web:440df112e7d0c6e85759e7",
  measurementId: "G-FXEBWRPCRB",
};

let auctionData = [];

// personal Imports
const auctionForm = document.getElementById("auctionForm");
const toggleModelBtn = document.getElementById("toggleModel");
const closeModelBtn = document.getElementById("closeModelBtn");
const createAuctionForm = document.getElementById("createAuctionForm");
const itemImageInput = document.getElementById("itemImage");
const imagePreview = document.getElementById("imagePreview");
const imageInputPlaceholder = document.getElementById("imageInputPlaceholder");

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getDatabase(app);
const auth = getAuth(app);
const timers = {};

// Model open close yaha se handle ho raha hai
toggleModelBtn.addEventListener("click", toggleModel);
closeModelBtn.addEventListener("click", toggleModel);
let isModelOpen = false;

function toggleModel() {
  auctionForm.classList.toggle("hidden");
  isModelOpen = !isModelOpen;
}

itemImageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      imagePreview.classList.remove("hidden");
      imageInputPlaceholder.classList.add("hidden");
    };
    reader.readAsDataURL(file);
  }
});

const logoutButton = document.getElementById("logoutButton");
const idToken = localStorage.getItem("idToken");

function isTokenExpired(token) {
  if (!token) return true;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const expiry = payload.exp * 1000;
  const now = Date.now();

  return now > expiry;
}

function checkLoggedin() {
  if (!idToken) {
    return;
  } else if (isTokenExpired(idToken)) {
    alert("Session expired. Please log in again.");
    localStorage.removeItem("idToken");
    localStorage.removeItem("refreshToken");

    window.location.href = "login.html";
  } else {
    console.log(isTokenExpired(idToken));
  }
}

logoutButton.addEventListener("click", () => {
  logoutSession();
});

async function logoutSession() {
  try {
    await signOut(auth);

    localStorage.removeItem("idToken");
    localStorage.removeItem("refreshToken");

    alert("Logout Successful!");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Logout Error:", err.message);
  }
}

// Form handle yaha se hai
createAuctionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const itemImage = document.getElementById("itemImage").files[0];
  const itemName = document.getElementById("itemName").value;
  const itemDescription = document.getElementById("itemDescription").value;
  const startingPrice = document.getElementById("startingPrice").value;
  const submitButton = document.getElementById("submitButton").value;

  const dataUpload = {
    itemImage: itemImage,
    itemName: itemName,
    itemDescription: itemDescription,
    startingPrice: startingPrice,
  };

  await postAuction(dataUpload);
});

async function postAuction(dataUpload) {
  const imageRef = storageRef(
    storage,
    "auction_images/" + dataUpload.itemImage.name
  );
  try {
    await uploadBytes(imageRef, dataUpload.itemImage);
    console.log("Image uploaded successfully!");
    const imageUrl = await getDownloadURL(imageRef);

    const userId = auth.currentUser ? auth.currentUser.uid : null;

    const auctionData = {
      itemName: dataUpload.itemName,
      itemDescription: dataUpload.itemDescription,
      startingPrice: dataUpload.startingPrice,
      imageUrl: imageUrl,
      userId: userId,
      currentAskPrice: dataUpload.startingPrice,
      isSold: false,
    };

    createAuction(auctionData);
  } catch (error) {
    console.error("Error uploading image: ", error);
  }
}

async function createAuction(itemData) {
  try {
    const auctionRef = ref(db, "auctions/");
    const newAuctionRef = push(auctionRef);
    await set(newAuctionRef, {
      ...itemData,
      itemId: newAuctionRef.key,
    });
    toggleModel();
    createAuctionForm.reset();
    getAllAuctions();
  } catch (error) {
    console.error("Error creating auction: ", error);
  }
}

async function getAllAuctions() {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, "auctions/"));

    if (snapshot) {
      const data = snapshot.val();
      auctionData = [];
      Object.keys(data).forEach((item) => {
        auctionData.push(data[item]);
      });

      if (auctionData) {
        displayData(auctionData);
      }
    } else {
      console.log("No data available");
    }
  } catch (err) {
    console.log(err.message);
  }
}

function displayData(auctionData) {
  const auctionCardGrid = document.getElementById("auctionCardGrid");
  auctionCardGrid.innerHTML = "";
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  auctionData.forEach((item, index) => {
    const card = document.createElement("div");
    card.className =
      "flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-gray-800 shadow-md";

    let timeLeft = item.endTime ? Math.max(item.endTime - Date.now(), 0) : 0;
    let minutes = Math.floor(timeLeft / 60000) || 0;
    let seconds = Math.floor((timeLeft % 60000) / 1000) || 0;

    card.innerHTML = `
      <a class="relative mx-3 mt-3 items-center justify-center flex h-60 overflow-hidden rounded-xl" href="#">
        <img class="object-contain" src="${item.imageUrl}" alt="${
      item.itemName
    }" />
        <span class="absolute top-0 left-0 m-2 rounded-full bg-${
          item.isSold ? "red" : "green"
        }-500 px-2 text-center text-sm font-medium text-white"> ${
      item.isSold ? "Sold" : "New"
    }</span>
      </a>
      <div class="mt-4 px-5 pb-5">
        <a href="#">
          <h5 class="text-xl tracking-tight text-slate-100">${
            item.itemName
          }</h5>
        </a>
        <p class="text-gray-400 mt-2 text-sm">${item.itemDescription}</p>

        <div class="mt-2 gap-4 mb-5 flex justify-between flex-col">
          <p class="flex flex-col gap-2">
            <span class="text-sm font-bold text-yellow-500">Starting Price: ${
              item.startingPrice
            }</span>
            <span class="text-sm font-bold text-green-500">Current ask Price: ${
              item.currentAskPrice
            }</span>
          </p>
          <p class="text-sm font-bold text-red-500">Time Left: <span id="timer-${
            item.itemId
          }">${parseInt(item.startingPrice) === parseInt(item.currentAskPrice) ? `Bidding not started`: `${minutes}m ${seconds}s`}</span></p>
          <p class="flex justify-center items-center gap-2">
            <span class="flex justify-center items-center text-xs font-medium">
              Your Bid :
              <input type="number" id="bid-${item.itemId}" min="${
      item.startingPrice
    }" class="text-sm bg-transparent border py-1 px-2 ms-2 rounded-lg text-gray-100 "></input>
            </span>
            <span>
              <button id="bid-button-${
                item.itemId
              }" class="border rounded-lg bg-transparent text-white px-2 py-1 text-xs font-medium"> Add</button>
            </span>
          </p>
        </div>
      </div>
    `;

    auctionCardGrid.appendChild(card);

    const updateTimer = setInterval(() => {
      const timeLeft = Math.max(item.endTime - Date.now(), 0);
      let minutes = Math.floor(timeLeft / 60000) || 0;
      let seconds = Math.floor((timeLeft % 60000) / 1000) || 0;

      const timerElement = document.getElementById(`timer-${item.itemId}`);
      if (timerElement) {
        timerElement.textContent = `${minutes}m ${seconds}s`;
      }

      if (timeLeft <= 0) {
        clearInterval(updateTimer);
        timerElement.textContent = "Auction Ended";
        document.getElementById(`bid-button-${item.itemId}`).disabled = true;

        finalizeAuction(item);
      }
    }, 1000);


    const bidButton = document.getElementById(`bid-button-${item.itemId}`);
    bidButton.addEventListener("click", () =>
      addUserBid(item.itemId, userId, item)
    );
  });
}

function finalizeAuction(item) {
  const auctionRef = ref(db, `auctions/${item.itemId}`);
  // Using onValue instead of once
  onValue(
    auctionRef,
    async (snapshot) => {
      const auctionData = snapshot.val();
      if (!auctionData) {
        console.error("Auction data not found!");
        return;
      }
      const highestBid = auctionData.highestBid || 0;
      const highestBidderId = auctionData.highestBidderId || null;

      try {
        await set(auctionRef, {
          ...auctionData,
          isSold: true,
          buyerId: highestBidderId,
        });
        console.log(`Auction ${item.itemId} finalized successfully!`);
      } catch (error) {
        console.error("Error finalizing auction: ", error);
      }
    },
    { onlyOnce: true }
  );
}

async function addUserBid(itemId, userId, item) {
  const bidInput = parseFloat(document.querySelector(`#bid-${itemId}`).value);
  const dbRef = ref(db);

  try {
    const snapshot = await get(child(dbRef, `auctions/`));

    if (snapshot.exists()) {
      const data = snapshot.val();
      let auctionData = null;

      Object.keys(data).forEach((key) => {
        if (data[key].itemId === itemId) {
          auctionData = data[key];
        }
      });

      if (auctionData) {
        if (bidInput > auctionData.currentAskPrice) {
          const auctionRef = ref(db, `auctions/${itemId}`);

          const bidHistory = auctionData.bids || {};
          bidHistory[userId] = {
            bidAmount: bidInput,
            timestamp: new Date().toISOString(),
          };

          const endTime = Date.now() + 2 * 60 * 1000;
          await set(auctionRef, {
            ...auctionData,
            currentAskPrice: bidInput,
            bids: bidHistory,
            endTime: endTime,
          });

          console.log("Bid placed successfully!");

          getAllAuctions();
        } else {
          alert("Your bid must be higher than the current ask price!");
        }
      } else {
        console.log("Auction item does not exist!");
      }
    } else {
      console.log("No auctions available!");
    }
  } catch (error) {
    console.error("Error fetching auction data: ", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getAllAuctions();
});

// Pahle check kar lete hai agar user pahle se login hai to direct dashboard me chaj denge
checkLoggedin();
