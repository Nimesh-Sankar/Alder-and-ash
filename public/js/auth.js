
const API_BASE = '';
function showAlert(message, type = "success") {
  const alertBox = document.getElementById("alertBox");

  if (!alertBox) return;

  alertBox.className =
  `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3 shadow rounded px-4 py-3`;

  alertBox.textContent = message;

  alertBox.classList.remove("d-none");

  setTimeout(() => {
    alertBox.classList.add("d-none");
  }, 3000);
}
async function validateUser() {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (!currentUser) return;

  try {
    const response = await fetch(
      `${API_BASE}/api/users/check-user/${currentUser._id}`
    );

    if (!response.ok) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

  } catch (error) {
    console.error(error);
  }
}

validateUser();


// CHECK LOGIN STATUS

const currentUser = localStorage.getItem('user');

const authLinks = document.getElementById('authLinks');
const userLinks = document.getElementById('userLinks');


if (currentUser && authLinks && userLinks) {
  authLinks.style.display = 'none';
  userLinks.style.display = 'block';
}
const profileLink = document.getElementById('profileLink');

if (profileLink && currentUser) {
  profileLink.href = '/user/profile';
}
// SIGNUP WITH OTP
if (document.getElementById('signupForm')) {

  const signupForm = document.getElementById('signupForm');
  const emailInput = document.getElementById('email');
  const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const phoneInput = document.getElementById('phone');
const signupPasswordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

  function clearErrors() {

    document.querySelectorAll('.input-error')
      .forEach((el) => {

        el.textContent = '';

      });

  }

  function setError(id, message) {

    const errorEl =
      document.getElementById(id);

    if (errorEl) {

      errorEl.textContent = message;

    }

  }
  firstNameInput.addEventListener("input", () => {
    if (firstNameInput.value.trim()) {
      setError("firstNameError", "");
    }
  });
  
  lastNameInput.addEventListener("input", () => {
    if (lastNameInput.value.trim()) {
      setError("lastNameError", "");
    }
  });
  
  emailInput.addEventListener("input", () => {
    const email = emailInput.value.trim();
  
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("emailError", "");
    }
  });
  
  phoneInput.addEventListener("input", () => {
    if (/^\d{10}$/.test(phoneInput.value.trim())) {
      setError("phoneError", "");
    }
  });
  
  signupPasswordInput.addEventListener("input", () => {
    if (signupPasswordInput.value.trim()) {
      setError("passwordError", "");
    }
  
    if (
      signupPasswordInput.value ===
      confirmPasswordInput.value
    ) {
      setError("confirmPasswordError", "");
    }
  });
  
  confirmPasswordInput.addEventListener("input", () => {
    if (
      confirmPasswordInput.value ===
      signupPasswordInput.value
    ) {
      setError("confirmPasswordError", "");
    }
  });

  async function sendOTP(email) {

    try {

      const response =
        await fetch(`${API_BASE}/api/otp/send`, {

          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email,
            purpose: 'signup'
          })

        });

      const data = await response.json();

      if (response.ok) {

        localStorage.setItem(
          'pendingEmail',
          email
        );

        window.location.href =
          '/otp';

      } else {

        setError(
          'emailError',
          data.message || 'Unable to send OTP'
        );

      }

    } catch (error) {

      console.error(
        'Send OTP error:',
        error
      );

      setError(
        'emailError',
        'Error sending OTP'
      );

    }

  }

  signupForm.addEventListener(
    'submit',

    async (e) => {

      e.preventDefault();

      clearErrors();

      const firstName =
        document.getElementById('firstName')
          .value
          .trim();

      const lastName =
        document.getElementById('lastName')
          .value
          .trim();

      const email =
        emailInput.value.trim();

      const phone =
        document.getElementById('phone')
          .value
          .trim();

      const password =
        document.getElementById('password')
          .value
          .trim();

      const confirmPassword =
        document.getElementById('confirmPassword')
          .value
          .trim();

      let hasError = false;

      if (!firstName) {

        setError(
          'firstNameError',
          'First name is required'
        );

        hasError = true;

      }

      if (!email) {

        setError(
          'emailError',
          'Email is required'
        );

        hasError = true;

      }

      if (!phone) {

        setError(
          'phoneError',
          'Phone number is required'
        );

        hasError = true;

      }

      if (!password) {

        setError(
          'passwordError',
          'Password is required'
        );

        hasError = true;

      }

      if (password !== confirmPassword) {

        setError(
          'confirmPasswordError',
          'Passwords do not match'
        );

        hasError = true;

      }

      if (hasError) return;

      localStorage.setItem(

        'signupData',

        JSON.stringify({

          firstName,
          lastName,
          email,
          phone,
          password

        })

      );

      await sendOTP(email);

    }

  );

}
// LOGIN

if (document.getElementById('loginForm')) {
  const loginForm = document.getElementById('loginForm');

  function setLoginError(id, message) {
    const errorEl = document.getElementById(id);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }
  const loginEmailInput =
  document.getElementById('email');

const loginPasswordInput =
  document.getElementById('password');

loginEmailInput.addEventListener('input', () => {

  const email = loginEmailInput.value.trim();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setLoginError('loginEmailError', '');
  }

});

loginPasswordInput.addEventListener('input', () => {

  if (loginPasswordInput.value.trim()) {
    setLoginError('loginPasswordError', '');
  }

});

  function clearLoginErrors() {
    const emailError = document.getElementById('loginEmailError');
    const passwordError = document.getElementById('loginPasswordError');

    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearLoginErrors();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    let hasError = false;

    if (!email) {
      setLoginError('loginEmailError', 'Email is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoginError('loginEmailError', 'Enter a valid email');
      hasError = true;
    }

    if (!password) {
      setLoginError('loginPasswordError', 'Password is required');
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        setLoginError('loginPasswordError', data.message || 'Login failed');
      }

    } catch (error) {
      console.error('Login error:', error);
      setLoginError('loginPasswordError', 'Something went wrong');
    }
  });
}

// =========================
// FORGOT PASSWORD
// =========================
if (document.getElementById('forgotPasswordForm')) {
  const forgotForm = document.getElementById('forgotPasswordForm');

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('forgotEmail').value.trim();
    const errorEl = document.getElementById('forgotEmailError');

    errorEl.textContent = '';

    if (!email) {
      errorEl.textContent = 'Email is required';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/forgot-password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('resetEmail', email);
        window.location.href = '/passwordotp';
      } else {
        errorEl.textContent = data.message || 'Unable to send OTP';
      }

    } catch (error) {
      console.error(error);
      errorEl.textContent = 'Something went wrong';
    }
  });
}

// =========================
// VERIFY RESET OTP
// =========================
if (document.getElementById("verifyResetOtpForm")) {

  const otpForm =
    document.getElementById("verifyResetOtpForm");

  const resendBtn =
    document.getElementById("resendResetOtpBtn");

  const timerDisplay =
    document.getElementById("resetTimerDisplay");

  let timeLeft = 30;
  let timer;

  function startResetOtpTimer() {

    resendBtn.style.display = "none";

    timer = setInterval(() => {

      timerDisplay.textContent =
        `Resend OTP in ${timeLeft}s`;

      timeLeft--;

      if (timeLeft < 0) {

        clearInterval(timer);

        timerDisplay.textContent =
          "OTP expired";

        resendBtn.style.display =
          "inline-block";

      }

    }, 1000);

  }

  startResetOtpTimer();

  otpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const otp =
      document.getElementById("resetOtp").value.trim();

    const errorEl =
      document.getElementById("resetOtpError");

    errorEl.textContent = "";

    if (!otp) {
      errorEl.textContent = "Please enter OTP";
      return;
    }

    localStorage.setItem("resetOtp", otp);
    window.location.href = "/reset-password";
  });

}

// =========================
// RESET PASSWORD
// =========================
if (document.getElementById('resetPasswordForm')) {
  const resetForm = document.getElementById('resetPasswordForm');

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = localStorage.getItem('resetEmail');
    const code = localStorage.getItem('resetOtp');

    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmNewPassword').value.trim();

    const newPasswordError = document.getElementById('newPasswordError');
    const confirmPasswordError = document.getElementById('confirmNewPasswordError');

    newPasswordError.textContent = '';
    confirmPasswordError.textContent = '';

    if (!newPassword) {
      newPasswordError.textContent = 'Password is required';
      return;
    }

    if (newPassword.length < 6) {
      newPasswordError.textContent = 'Minimum 6 characters';
      return;
    }

    if (!confirmPassword) {
      confirmPasswordError.textContent = 'Please confirm password';
      return;
    }

    if (newPassword !== confirmPassword) {
      confirmPasswordError.textContent = 'Passwords do not match';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: code,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('resetEmail');
        localStorage.removeItem('resetOtp');
        window.location.href = '/login';
      } else {
        confirmPasswordError.textContent = data.message || 'Reset failed';
      }

    } catch (error) {
      console.error(error);
      confirmPasswordError.textContent = 'Something went wrong';
    }
  });
}// =========================
// USER PROFILE
// =========================
if (document.getElementById('profileFirstName')) {
  const currentUser = JSON.parse(localStorage.getItem('user'));

  if (!currentUser || !currentUser._id) {
    window.location.href = '/login';
  }
}
// =========================
// SIGNUP OTP VERIFY
// =========================
let isVerifyingOtp=false;
async function verifySignupOtp() {

  if(isVerifyingOtp){
    return
  }
  isVerifyingOtp=true;
  const verifyBtn =
  document.getElementById("verifyOtpBtn");

if (verifyBtn) {
  verifyBtn.disabled = true;
  verifyBtn.innerText = "Verifying...";
}

  const otp =
    document.getElementById("otp").value.trim();

  const email =
    localStorage.getItem("pendingEmail");

  const signupData =
    JSON.parse(localStorage.getItem("signupData"));

  const message =
    document.getElementById("otpMessage");

  message.textContent = "";

  if (!otp) {

    message.textContent =
      "Please enter OTP";

    return;
  }

  try {

    const res = await fetch(
      `${API_BASE}/api/otp/verify`,
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          email,
          otp,
          purpose: "signup"

        })

      }
    );

    const data = await res.json();

    if (!res.ok || !data.verified) {

      message.textContent =
        data.message || "Invalid OTP";
        isVerifyingOtp=false;

      return;
    }

    // CREATE USER AFTER OTP VERIFIED

    const signupResponse =
      await fetch(`${API_BASE}/auth/signup`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(signupData)

      });

    const signupResult =
      await signupResponse.json();

    if (!signupResponse.ok) {

      message.textContent =
        signupResult.message || "Signup failed";

      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify(signupResult.user)
    );

    localStorage.removeItem("pendingEmail");
    localStorage.removeItem("signupData");

    window.location.replace("/");

  } catch (error) {

    console.error(error);
    isVerifyingOtp=false;

    message.textContent =
      "Something went wrong";

  }

}

// =========================
// OTP PAGE
// =========================

if (document.getElementById("otpForm")) {
  if(!localStorage.getItem(
    "pendingEmail"
  ) ){
    window.location.replace(
      "/signup"
    );
  }

  const otpForm =
    document.getElementById("otpForm");

  const resendBtn =
    document.getElementById("resendOtpBtn");

  const timerDisplay =
    document.getElementById("timerDisplay");

  let timeLeft = 30;
  let timer;

  function startTimer() {

    resendBtn.style.display = "none";

    timer = setInterval(() => {

      timerDisplay.textContent =
        `Resend OTP in ${timeLeft}s`;

      timeLeft--;

      if (timeLeft < 0) {

        clearInterval(timer);

        timerDisplay.textContent =
          "OTP expired";

        resendBtn.style.display =
          "inline-block";
      }

    }, 1000);
  }

  startTimer();

  // VERIFY OTP
  otpForm.addEventListener(
    "submit",

    async (e) => {

      e.preventDefault();

      await verifySignupOtp();

    }
  );

  // RESEND OTP
  resendBtn.addEventListener(
    "click",

    async () => {

      const email =
        localStorage.getItem(
          "pendingEmail"
        );
        
      const message =
      document.getElementById(
        "otpMessage"
      );

    message.textContent = "";
    
        if(!email){
          message.textContent="Email not found"
          return;
        }


      try {

        const response =
          await fetch(
            `${API_BASE}/api/otp/resend`,
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({

                email,
                purpose: "signup"

              })

            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          message.textContent =
            data.message ||
            "Failed to resend OTP";

          return;
        }

        clearInterval(timer);

        timeLeft = 30;

        startTimer();

        message.textContent =
          "OTP resent successfully";

      } catch (error) {

        console.error(error);

        message.textContent =
          "Something went wrong";

      }

    }
  );

}


// LOGOUT
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('user');
    localStorage.removeItem("pendingEmail")
    localStorage.removeItem("signupData")
    window.location.replace('/');
  });
}
const togglePassword =
document.getElementById(
"togglePassword"
);

const passwordInput =
document.getElementById(
"password"
);

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePassword.innerText = "><";
    } else {
      passwordInput.type = "password";
      togglePassword.innerText = "<>";
    }
  });
}

const signupPassword =
  document.getElementById("password");

const confirmPassword =
  document.getElementById("confirmPassword");

const toggleSignupPassword =
  document.getElementById("toggleSignupPassword");

const toggleConfirmPassword =
  document.getElementById("toggleConfirmPassword");

if (
  toggleSignupPassword &&
  signupPassword
) {
  toggleSignupPassword.addEventListener(
    "click",
    () => {
      if (
        signupPassword.type ===
        "password"
      ) {
        signupPassword.type =
          "text";

        toggleSignupPassword.innerText =
          "><";
      } else {
        signupPassword.type =
          "password";

        toggleSignupPassword.innerText =
          "<>";
      }
    }
  );
}

if (
  toggleConfirmPassword &&
  confirmPassword
) {
  toggleConfirmPassword.addEventListener(
    "click",
    () => {
      if (
        confirmPassword.type ===
        "password"
      ) {
        confirmPassword.type =
          "text";

        toggleConfirmPassword.innerText =
          "><";
      } else {
        confirmPassword.type =
          "password";

        toggleConfirmPassword.innerText =
          "<>";
      }
    }
  );
}