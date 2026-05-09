function showPage(id){

  document.querySelectorAll(
    '.login-page,.servers-page,.dashboard-page,.transcript-page'
  ).forEach(page=>{
    page.classList.add('hidden');
  });

  document.getElementById(id).classList.remove('hidden');
}

document.querySelectorAll('.nav').forEach(button=>{

  button.addEventListener('click',()=>{

    document.querySelectorAll('.nav').forEach(b=>{
      b.classList.remove('active');
    });

    button.classList.add('active');

    document.querySelectorAll('.dash-section').forEach(section=>{
      section.classList.remove('active');
    });

    const page = button.dataset.page;

    document.getElementById(page).classList.add('active');
  });
});
