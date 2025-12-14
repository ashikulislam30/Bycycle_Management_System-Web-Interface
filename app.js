/* Bicycle Management System - Frontend Only (localStorage DB)
   Covers: Student/Admin auth, Bicycle inventory CRUD, Rent + Payments, Rental history, Rules/About, Maintenance mode.
*/

const DB_KEY = "BMS_DB_v1_1";

function nowISO() { return new Date().toISOString(); }

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);

  // Initialize default DB similar to your C init (admins pre-created)
  const db = {
    settings: {
      maintenanceMode: false,
      currentAdmin: null,
      currentStudent: null
    },
    admins: [
      { username: "notthedroid", passHash: hashPassword("notthedroid") },
      { username: "ashik01",     passHash: hashPassword("password") },
      { username: "ashik02",     passHash: hashPassword("1234") }
      // superadmin in your code checks "perplexahedron" — you can add it if you want
      // { username:"perplexahedron", passHash: hashPassword("admin") }
    ],
    students: [],
    bicycles: [],
    rentals: []
  };
  saveDB(db);
  return db;
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function hashPassword(password) {
  // Same transformation style as your C hashPassword (character shifting)
  const arr = password.split("");
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i];
    const code = c.charCodeAt(0);

    if (c >= 'a' && c <= 'z') {
      if (code % 2 === 0) arr[i] = String.fromCharCode(code + 3);
      else arr[i] = String.fromCharCode(code - 3);
    } else if (c >= 'A' && c <= 'Z') {
      if (code % 2 === 0) arr[i] = String.fromCharCode(code - 5);
      else arr[i] = String.fromCharCode(code + 5);
    } else if (c >= '0' && c <= '9') {
      const digit = code - '0'.charCodeAt(0);
      if (digit % 2 === 0) arr[i] = String.fromCharCode(code + 2);
      else arr[i] = String.fromCharCode(code - 2);
    }
  }
  return arr.join("");
}

function uid(len=8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

function uniqueId(existingIds, max=999) {
  let id = Math.floor(Math.random()*max);
  if (existingIds.has(id)) id = Math.abs(id * (Math.floor(Math.random()*10)) / 3 + 5);
  return Math.floor(id);
}

function requireNoMaintenanceOrRedirect() {
  const db = loadDB();
  const isMaintenance = db.settings.maintenanceMode;
  if (isMaintenance) {
    // show maintenance overlay if exists
    const el = document.getElementById("maintenance");
    if (el) el.classList.remove("hidden");
  }
}

function setToast(id, msg, ok=true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden", "ok", "bad");
  el.classList.add(ok ? "ok" : "bad");
  el.textContent = msg;
}

function clearToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");
}

function logout(role) {
  const db = loadDB();
  if (role === "admin") db.settings.currentAdmin = null;
  if (role === "student") db.settings.currentStudent = null;
  saveDB(db);
}

function isSuperAdmin(username) {
  // same check as your C code
  return username === "perplexahedron";
}

// Define maximum lengths for username and password
const MAX_USERNAME_LENGTH = 20;
const MAX_PASSWORD_LENGTH = 20;

// =======================
// Shared render helpers
// =======================
function renderBicycles(tableId, options={}) {
  const db = loadDB();
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  tbody.innerHTML = "";
  db.bicycles.forEach(b => {
    const tr = document.createElement("tr");

    const cols = [
      b.id,
      b.brand,
      b.model,
      Number(b.costPerMin).toFixed(2),
      b.inventory
    ];

    cols.forEach(v => {
      const td = document.createElement("td");
      td.textContent = v;
      tr.appendChild(td);
    });

    if (options.actions) {
      const td = document.createElement("td");
      td.innerHTML = options.actions(b);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

function renderUsers(tableId) {
  const db = loadDB();
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";
  db.students.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.username}</td><td>********</td>`;
    tbody.appendChild(tr);
  });
}

function renderRentals(tableId, filterUsername=null) {
  const db = loadDB();
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";

  const rows = filterUsername
    ? db.rentals.filter(r => r.username === filterUsername)
    : db.rentals;

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rentalId}</td>
      <td>${r.bicycleId}</td>
      <td>${r.durationMin}</td>
      <td>${Number(r.totalCost).toFixed(2)}</td>
      <td>${r.brand}</td>
      <td>${r.model}</td>
      <td>${r.username}</td>
      <td>${r.transactionId}</td>
      <td>${r.paymentMethod}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateKPIs() {
  const db = loadDB();
  const bikes = db.bicycles.length;
  const users = db.students.length;
  const rentals = db.rentals.length;
  const a = document.getElementById("kpiBikes");
  const b = document.getElementById("kpiUsers");
  const c = document.getElementById("kpiRentals");
  if (a) a.textContent = bikes;
  if (b) b.textContent = users;
  if (c) c.textContent = rentals;
}

// =======================
// Index page
// =======================
function initIndex() {
  const db = loadDB();
  updateKPIs();
  requireNoMaintenanceOrRedirect();

  const maint = document.getElementById("maintenanceToggle");
  if (maint) {
    maint.addEventListener("click", () => {
      // simulation only: ask user to type Y to end maintenance
      const res = prompt("Maintenance mode is ON.\nType Y to go back online:");
      if (res && res.trim().toLowerCase() === "y") {
        const db2 = loadDB();
        db2.settings.maintenanceMode = false;
        saveDB(db2);
        location.reload();
      }
    });
  }

  const maintBanner = document.getElementById("maintenance");
  if (maintBanner && db.settings.maintenanceMode) {
    maintBanner.classList.remove("hidden");
  }
}

// =======================
// Student page
// =======================
function initStudentPage() {
  const db = loadDB();
  requireNoMaintenanceOrRedirect();

  const who = document.getElementById("studentWho");
  if (who) who.textContent = db.settings.currentStudent ? db.settings.currentStudent : "Not logged in";

  const tabAuth = document.getElementById("tabStudentAuth");
  const tabApp  = document.getElementById("tabStudentApp");

  function showAuth() {
    tabAuth?.classList.remove("hidden");
    tabApp?.classList.add("hidden");
  }
  function showApp() {
    tabAuth?.classList.add("hidden");
    tabApp?.classList.remove("hidden");
  }

  if (db.settings.currentStudent) showApp();
  else showAuth();

  // Signup
  const signupBtn = document.getElementById("studentSignupBtn");
  signupBtn?.addEventListener("click", () => {
    clearToast("studentToast");
    const u = document.getElementById("suUser").value.trim();
    const p = document.getElementById("suPass").value.trim();
    const c = document.getElementById("suConfirm").value.trim();

    if (!u || !p) return setToast("studentToast", "Username and password required.", false);
    if (u.length > MAX_USERNAME_LENGTH || p.length > MAX_PASSWORD_LENGTH)
      return setToast("studentToast", "Username/password too long.", false);
    if (p !== c) return setToast("studentToast", "Password does not match.", false);

    const db2 = loadDB();
    if (db2.students.some(x => x.username === u))
      return setToast("studentToast", "User already taken. Choose another username.", false);

    db2.students.push({ username: u, passHash: hashPassword(p) });
    saveDB(db2);
    setToast("studentToast", "Signup successful. Now login.", true);
  });

  // Login
  const loginBtn = document.getElementById("studentLoginBtn");
  loginBtn?.addEventListener("click", () => {
    clearToast("studentToast");
    const u = document.getElementById("liUser").value.trim();
    const p = document.getElementById("liPass").value.trim();

    const db2 = loadDB();
    const ok = db2.students.some(x => x.username === u && x.passHash === hashPassword(p));
    if (!ok) return setToast("studentToast", "Login failed. Invalid username or password.", false);

    db2.settings.currentStudent = u;
    saveDB(db2);
    location.reload();
  });

  // Logout
  const logoutBtn = document.getElementById("studentLogoutBtn");
  logoutBtn?.addEventListener("click", () => {
    logout("student");
    location.reload();
  });

  // App area render
  renderBicycles("studentBikeTable", {
    actions: (b) => `<button class="btn primary" onclick="openRent(${b.id})">Rent</button>`
  });

  const myHistoryBtn = document.getElementById("myHistoryBtn");
  myHistoryBtn?.addEventListener("click", () => {
    const db3 = loadDB();
    if (!db3.settings.currentStudent) return;
    renderRentals("studentRentalTable", db3.settings.currentStudent);
  });

  // initial history render
  if (db.settings.currentStudent) renderRentals("studentRentalTable", db.settings.currentStudent);
}

window.openRent = function(bicycleId){
  const db = loadDB();
  if (!db.settings.currentStudent) {
    alert("Please login as student first.");
    return;
  }

  const bike = db.bicycles.find(b => b.id === bicycleId);
  if (!bike) return alert("Invalid bicycle ID.");
  if (bike.inventory <= 0) return alert("Out of stock.");

  const duration = Number(prompt(`Enter rent duration (minutes) for ${bike.brand} ${bike.model}:`, "10"));
  if (!Number.isFinite(duration) || duration < 0) return alert("Invalid duration.");

  const total = duration * Number(bike.costPerMin);
  const method = prompt(`Total cost: $${total.toFixed(2)}\nType 1 for Bkash, 2 for Nagad. (0 cancel)`, "1");
  if (!method || method.trim() === "0") return;

  const payMethod = method.trim() === "1" ? "Bkash" : (method.trim() === "2" ? "Nagad" : null);
  if (!payMethod) return alert("Invalid payment choice.");

  // Simulate payment confirmation by matching amount
  const pay = Number(prompt(`Pay with ${payMethod}\nEnter the exact amount:`, total.toFixed(2)));
  if (Number(pay) !== Number(total)) return alert("Payment failed. Amount mismatch.");

  // Update DB: decrease inventory, add rental history
  const rentalId = uniqueId(new Set(db.rentals.map(r=>r.rentalId)));
  const txn = uid(8);
  const username = db.settings.currentStudent;

  bike.inventory -= 1;

  db.rentals.unshift({
    rentalId,
    bicycleId: bike.id,
    durationMin: duration,
    totalCost: total,
    brand: bike.brand,
    model: bike.model,
    username,
    transactionId: txn,
    paymentMethod: payMethod,
    createdAt: nowISO()
  });

  saveDB(db);
  alert("Payment successful. Bicycle rented.");
  location.reload();
}

// =======================
// Admin page
// =======================
function initAdminPage() {
  const db = loadDB();
  requireNoMaintenanceOrRedirect();

  const who = document.getElementById("adminWho");
  if (who) who.textContent = db.settings.currentAdmin ? db.settings.currentAdmin : "Not logged in";

  const tabAuth = document.getElementById("tabAdminAuth");
  const tabApp  = document.getElementById("tabAdminApp");

  function showAuth() {
    tabAuth?.classList.remove("hidden");
    tabApp?.classList.add("hidden");
  }
  function showApp() {
    tabAuth?.classList.add("hidden");
    tabApp?.classList.remove("hidden");
  }

  if (db.settings.currentAdmin) showApp();
  else showAuth();

  // Admin Login
  const loginBtn = document.getElementById("adminLoginBtn");
  loginBtn?.addEventListener("click", () => {
    clearToast("adminToast");
    const u = document.getElementById("adUser").value.trim();
    const p = document.getElementById("adPass").value.trim();

    const db2 = loadDB();
    const ok = db2.admins.some(x => x.username === u && x.passHash === hashPassword(p));
    if (!ok) return setToast("adminToast", "Login failed. Invalid username or password.", false);

    db2.settings.currentAdmin = u;
    saveDB(db2);
    location.reload();
  });

  // Admin Logout
  const logoutBtn = document.getElementById("adminLogoutBtn");
  logoutBtn?.addEventListener("click", () => {
    logout("admin");
    location.reload();
  });

  // Maintenance toggle
  const maintBtn = document.getElementById("maintenanceBtn");
  maintBtn?.addEventListener("click", () => {
    const db2 = loadDB();
    db2.settings.maintenanceMode = !db2.settings.maintenanceMode;
    saveDB(db2);
    alert("Maintenance mode: " + (db2.settings.maintenanceMode ? "ON" : "OFF"));
  });

  // Add Bicycle
  const addBtn = document.getElementById("addBikeBtn");
  addBtn?.addEventListener("click", () => {
    clearToast("adminToast2");

    const brand = document.getElementById("bikeBrand").value.trim();
    const model = document.getElementById("bikeModel").value.trim();
    const cost  = Number(document.getElementById("bikeCost").value);
    const inv   = Number(document.getElementById("bikeInv").value);

    if (!brand || !model) return setToast("adminToast2", "Brand and model required.", false);
    if (!Number.isFinite(cost) || cost < 0) return setToast("adminToast2", "Invalid cost.", false);
    if (!Number.isFinite(inv) || inv < 0) return setToast("adminToast2", "Invalid inventory.", false);

    const db2 = loadDB();
    const id = uniqueId(new Set(db2.bicycles.map(b=>b.id))) + 1;
    db2.bicycles.push({ id, brand, model, costPerMin: cost, inventory: inv });
    saveDB(db2);

    setToast("adminToast2", "Bicycle added successfully.", true);
    renderBicycles("adminBikeTable", { actions: adminActions });
    updateKPIs();
  });

  // Render tables
  renderBicycles("adminBikeTable", { actions: adminActions });
  renderUsers("adminUserTable");
  renderRentals("adminRentalTable");

  updateKPIs();

  // Change password
  const changePassBtn = document.getElementById("changePassBtn");
  changePassBtn?.addEventListener("click", () => {
    clearToast("adminToast3");

    const oldP = document.getElementById("oldPass").value.trim();
    const newP = document.getElementById("newPass").value.trim();
    const cnf  = document.getElementById("cnfPass").value.trim();

    if (!oldP || !newP) return setToast("adminToast3", "Old and new password required.", false);
    if (newP !== cnf) return setToast("adminToast3", "Confirm password does not match.", false);

    const db2 = loadDB();
    const me = db2.settings.currentAdmin;
    const idx = db2.admins.findIndex(a => a.username === me);
    if (idx < 0) return setToast("adminToast3", "Admin not found.", false);

    if (db2.admins[idx].passHash !== hashPassword(oldP))
      return setToast("adminToast3", "Old password does not match.", false);

    db2.admins[idx].passHash = hashPassword(newP);
    saveDB(db2);
    setToast("adminToast3", "Password changed successfully.", true);
  });

  // Admin management (basic add/remove)
  const addAdminBtn = document.getElementById("addAdminBtn");
  addAdminBtn?.addEventListener("click", () => {
    clearToast("adminToast4");
    const u = document.getElementById("newAdminUser").value.trim();
    const p = document.getElementById("newAdminPass").value.trim();
    const c = document.getElementById("newAdminCnf").value.trim();

    if (!u || !p) return setToast("adminToast4", "Username/password required.", false);
    if (p !== c) return setToast("adminToast4", "Confirm password mismatch.", false);

    const db2 = loadDB();
    if (db2.admins.some(a => a.username === u))
      return setToast("adminToast4", "Admin username already exists.", false);

    db2.admins.push({ username: u, passHash: hashPassword(p) });
    saveDB(db2);
    setToast("adminToast4", "Admin added.", true);
    renderAdminList();
  });

  renderAdminList();
}

function adminActions(b) {
  return `
    <button class="btn" onclick="adminEdit(${b.id})">Update</button>
    <button class="btn danger" onclick="adminDelete(${b.id})">Remove</button>
  `;
}

window.adminEdit = function(id){
  const db = loadDB();
  const bike = db.bicycles.find(x => x.id === id);
  if (!bike) return alert("Invalid ID.");

  const field = prompt("Update: 1=Brand, 2=Model, 3=Cost, 4=Inventory, 0=Cancel", "1");
  if (!field || field.trim()==="0") return;

  if (field.trim()==="1") {
    const v = prompt("Enter updated brand:", bike.brand);
    if (v) bike.brand = v.trim();
  } else if (field.trim()==="2") {
    const v = prompt("Enter updated model:", bike.model);
    if (v) bike.model = v.trim();
  } else if (field.trim()==="3") {
    const v = Number(prompt("Enter updated cost per minute:", bike.costPerMin));
    if (!Number.isFinite(v) || v < 0) return alert("Invalid cost.");
    bike.costPerMin = v;
  } else if (field.trim()==="4") {
    const v = Number(prompt("Enter updated inventory:", bike.inventory));
    if (!Number.isFinite(v) || v < 0) return alert("Invalid inventory.");
    bike.inventory = v;
  } else {
    return alert("Invalid choice.");
  }

  saveDB(db);
  alert("Bicycle updated.");
  location.reload();
}

window.adminDelete = function(id){
  const db = loadDB();
  const idx = db.bicycles.findIndex(x => x.id === id);
  if (idx < 0) return alert("Invalid ID.");
  const ok = confirm("Are you sure to remove this bicycle?");
  if (!ok) return;
  db.bicycles.splice(idx, 1);
  saveDB(db);
  alert("Bicycle removed.");
  location.reload();
}

function renderAdminList(){
  const db = loadDB();
  const tbody = document.querySelector("#adminListTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  db.admins.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.username}</td>
      <td>********</td>
      <td><button class="btn danger" onclick="removeAdmin('${a.username}')">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });
}

window.removeAdmin = function(username){
  const db = loadDB();
  const me = db.settings.currentAdmin;
  if (username === me) return alert("You cannot remove your own account while logged in.");

  const ok = confirm("Remove admin: " + username + " ?");
  if (!ok) return;
  const idx = db.admins.findIndex(a => a.username === username);
  if (idx < 0) return;
  db.admins.splice(idx, 1);
  saveDB(db);
  renderAdminList();
  alert("Admin removed.");
}

// Page boot
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");
  if (page === "index") initIndex();
  if (page === "student") initStudentPage();
  if (page === "admin") initAdminPage();
});
