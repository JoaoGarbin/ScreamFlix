const loginTab = document.getElementById("login-tab");
      const registerTab = document.getElementById("register-tab");
      const loginForm = document.getElementById("login-form");
      const registerForm = document.getElementById("register-form");

      loginTab.addEventListener("click", () => {
        loginTab.classList.replace("border-transparent", "border-primary-red");
        loginTab.classList.replace("text-gray-400", "text-white");
        registerTab.classList.replace("border-primary-red", "border-transparent");
        registerTab.classList.replace("text-white", "text-gray-400");
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
      });

      registerTab.addEventListener("click", () => {
        registerTab.classList.replace("border-transparent", "border-primary-red");
        registerTab.classList.replace("text-gray-400", "text-white");
        loginTab.classList.replace("border-primary-red", "border-transparent");
        loginTab.classList.replace("text-white", "text-gray-400");
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
      });

      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = document.getElementById("login-email").value;
        if (email.endsWith("@admin.com")) {
          window.location.href = "./Movie/registerMovie.html";
        } else {
          window.location.href = "../Library/catalog.html";
        }
      });

      registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = document.getElementById("register-email").value;
        const username = document.getElementById("register-name").value;

        if (email.endsWith("@admin.com")) {
          window.location.href = "registerMovie.html";
        } else {
          window.location.href = `/screens/Movie/registerMovie.html?username=${encodeURIComponent(
            username
          )}`;
        }
      });