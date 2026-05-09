const CLIENT_ID = "YOUR_CLIENT_ID_HERE";
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = "identify guilds";

function loginWithDiscord(){
  const url =
    "https://discord.com/oauth2/authorize" +
    "?client_id=" + encodeURIComponent(CLIENT_ID) +
    "&redirect_uri=" + encodeURIComponent(REDIRECT_URI) +
    "&response_type=token" +
    "&scope=" + encodeURIComponent(SCOPES);

  window.location.href = url;
}

function showPage(id){
  document.querySelectorAll(".page").forEach(page=>page.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function logout(){
  localStorage.removeItem("discord_token");
  window.location.href = REDIRECT_URI;
}

function avatarUrl(user){
  if(!user.avatar) return "https://cdn.discordapp.com/embed/avatars/0.png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}

async function fetchDiscord(token){
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers:{ Authorization:`Bearer ${token}` }
  });

  const guildRes = await fetch("https://discord.com/api/users/@me/guilds", {
    headers:{ Authorization:`Bearer ${token}` }
  });

  if(!userRes.ok) throw new Error("Login failed");

  const user = await userRes.json();
  const guilds = guildRes.ok ? await guildRes.json() : [];

  loadDashboard(user, guilds);
}

function hasManagePermission(guild){
  try{
    const perms = BigInt(guild.permissions || "0");
    return (perms & 0x20n) === 0x20n || (perms & 0x8n) === 0x8n;
  }catch{
    return false;
  }
}

function guildIcon(guild){
  if(!guild.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
}

function loadDashboard(user, guilds){
  document.getElementById("userName").textContent = user.username;
  document.getElementById("dashName").textContent = user.username;
  document.getElementById("userAvatar").src = avatarUrl(user);
  document.getElementById("dashAvatar").src = avatarUrl(user);

  const grid = document.getElementById("serverGrid");
  grid.innerHTML = "";

  const sorted = guilds.filter(hasManagePermission);

  if(sorted.length === 0){
    grid.innerHTML = `<p>No manageable servers found. Invite the bot to a server first.</p>`;
  }

  sorted.forEach(guild=>{
    const icon = guildIcon(guild);
    const card = document.createElement("div");
    card.className = "server-card";
    card.innerHTML = `
      <div class="server-icon">${icon ? `<img src="${icon}" style="width:100%;height:100%;border-radius:50%">` : "💬"}</div>
      <h3>${guild.name}</h3>
      <button>Manage</button>
    `;

    card.querySelector("button").addEventListener("click",()=>{
      document.getElementById("selectedServer").textContent = guild.name;
      document.getElementById("homeTitle").textContent = guild.name;
      showPage("dashboardPage");
    });

    grid.appendChild(card);
  });

  showPage("serversPage");
}

function showTranscript(){
  showPage("transcriptPage");
}

document.querySelectorAll(".nav").forEach(button=>{
  button.addEventListener("click",()=>{
    document.querySelectorAll(".nav").forEach(b=>b.classList.remove("active"));
    button.classList.add("active");

    document.querySelectorAll(".dash-section").forEach(section=>section.classList.remove("active"));
    document.getElementById(button.dataset.page).classList.add("active");
  });
});

document.querySelectorAll(".module").forEach(card=>{
  card.addEventListener("click",()=>{
    const page = card.dataset.go;

    document.querySelectorAll(".dash-section").forEach(section=>section.classList.remove("active"));
    document.getElementById(page).classList.add("active");

    document.querySelectorAll(".nav").forEach(button=>{
      button.classList.toggle("active", button.dataset.page === page);
    });
  });
});

window.addEventListener("load",()=>{
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const token = hash.get("access_token");

  if(token){
    localStorage.setItem("discord_token", token);
    history.replaceState(null, "", REDIRECT_URI);
    fetchDiscord(token).catch(()=>logout());
    return;
  }

  const saved = localStorage.getItem("discord_token");

  if(saved){
    fetchDiscord(saved).catch(()=>logout());
  }
});
