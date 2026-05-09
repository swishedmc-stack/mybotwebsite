const CLIENT_ID = "1492663345612849203";
const ALLOWED_USER_ID = "1130217773579128853";

const REDIRECT_URI = "https://swishedmc-stack.github.io/mybotwebsite/";
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

  document.querySelectorAll(".page").forEach(page=>{
    page.classList.add("hidden");
  });

  document.getElementById(id).classList.remove("hidden");
}

function logout(){

  localStorage.removeItem("discord_token");
  window.location.href = REDIRECT_URI;
}

function avatarUrl(user){

  if(!user.avatar){
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }

  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}

async function fetchDiscord(token){

  const userRes = await fetch(
    "https://discord.com/api/users/@me",
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );

  if(!userRes.ok){
    throw new Error("Discord login failed");
  }

  const user = await userRes.json();

  if(user.id !== ALLOWED_USER_ID){

    localStorage.removeItem("discord_token");

    alert("You are not allowed to access this dashboard.");

    showPage("loginPage");

    return;
  }

  const guildRes = await fetch(
    "https://discord.com/api/users/@me/guilds",
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  );

  const guilds = guildRes.ok
    ? await guildRes.json()
    : [];

  loadDashboard(user, guilds);
}

function hasManagePermission(guild){

  try{

    const perms = BigInt(guild.permissions || "0");

    const MANAGE_GUILD = 0x20n;
    const ADMINISTRATOR = 0x8n;

    return (
      (perms & MANAGE_GUILD) === MANAGE_GUILD ||
      (perms & ADMINISTRATOR) === ADMINISTRATOR
    );

  }catch{

    return false;
  }
}

function guildIcon(guild){

  if(!guild.icon){
    return null;
  }

  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
}

function loadDashboard(user, guilds){

  const avatar = avatarUrl(user);

  const userName = document.getElementById("userName");
  const dashName = document.getElementById("dashName");

  const userAvatar = document.getElementById("userAvatar");
  const dashAvatar = document.getElementById("dashAvatar");

  if(userName){
    userName.textContent = user.username;
  }

  if(dashName){
    dashName.textContent = user.username;
  }

  if(userAvatar){
    userAvatar.src = avatar;
  }

  if(dashAvatar){
    dashAvatar.src = avatar;
  }

  const grid = document.getElementById("serverGrid");

  if(grid){

    grid.innerHTML = "";

    const manageable = guilds.filter(
      hasManagePermission
    );

    if(manageable.length === 0){

      grid.innerHTML =
        "<p>No manageable servers found.</p>";
    }

    manageable.forEach(guild=>{

      const icon = guildIcon(guild);

      const card =
        document.createElement("div");

      card.className = "server-card";

      card.innerHTML = `
        <div class="server-icon">
          ${
            icon
            ? `<img src="${icon}" style="width:100%;height:100%;border-radius:50%">`
            : "💬"
          }
        </div>

        <h3>${guild.name}</h3>

        <button type="button">
          Manage
        </button>
      `;

      card.querySelector("button")
      .addEventListener("click",()=>{

        const selectedServer =
          document.getElementById(
            "selectedServer"
          );

        const homeTitle =
          document.getElementById(
            "homeTitle"
          );

        if(selectedServer){
          selectedServer.textContent =
            guild.name;
        }

        if(homeTitle){
          homeTitle.textContent =
            guild.name;
        }

        showPage("dashboardPage");
      });

      grid.appendChild(card);
    });
  }

  showPage("serversPage");
}

function showTranscript(){

  showPage("transcriptPage");
}

document.addEventListener(
  "click",
  function(e){

    const nav =
      e.target.closest(".nav");

    if(nav){

      document
      .querySelectorAll(".nav")
      .forEach(b=>{
        b.classList.remove("active");
      });

      nav.classList.add("active");

      document
      .querySelectorAll(".dash-section")
      .forEach(section=>{
        section.classList.remove(
          "active"
        );
      });

      const section =
        document.getElementById(
          nav.dataset.page
        );

      if(section){
        section.classList.add("active");
      }
    }

    const module =
      e.target.closest(".module");

    if(module){

      const page =
        module.dataset.go;

      document
      .querySelectorAll(".dash-section")
      .forEach(section=>{
        section.classList.remove(
          "active"
        );
      });

      const section =
        document.getElementById(page);

      if(section){
        section.classList.add("active");
      }

      document
      .querySelectorAll(".nav")
      .forEach(button=>{

        button.classList.toggle(
          "active",
          button.dataset.page === page
        );
      });
    }
  }
);

window.addEventListener(
  "load",
  ()=>{

    const hash =
      new URLSearchParams(
        window.location.hash.substring(1)
      );

    const token =
      hash.get("access_token");

    if(token){

      localStorage.setItem(
        "discord_token",
        token
      );

      history.replaceState(
        null,
        "",
        REDIRECT_URI
      );

      fetchDiscord(token)
      .catch(()=>{

        localStorage.removeItem(
          "discord_token"
        );

        showPage("loginPage");
      });

      return;
    }

    const saved =
      localStorage.getItem(
        "discord_token"
      );

    if(saved){

      fetchDiscord(saved)
      .catch(()=>{

        localStorage.removeItem(
          "discord_token"
        );

        showPage("loginPage");
      });
    }
  }
);
