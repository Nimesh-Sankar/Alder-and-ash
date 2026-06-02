console.log("USER JS LOADED");

const API_BASE = "";
const urlParams = new URLSearchParams(window.location.search);

const googleUser = urlParams.get("googleUser");

if (googleUser) {
  const parsedUser = JSON.parse(decodeURIComponent(googleUser));

  localStorage.setItem("user", JSON.stringify(parsedUser));

  window.history.replaceState({}, document.title, window.location.pathname);
}

const currentUser = JSON.parse(localStorage.getItem("user"));

if (!currentUser) {
  window.location.href = "/login";
}

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

  if (!currentUser) {
    window.location.href = "/login";
    return;
  }

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

const params = new URLSearchParams(window.location.search);
const editId = params.get("edit");


// PROFILE PAGE
async function loadProfile() {
  try {
    const userId = currentUser._id;

    const profileResponse = await fetch(`${API_BASE}/api/users/profile/${userId}`);
    const profileData = await profileResponse.json();

    if (profileResponse.ok) {
      const user = profileData.user;

      const headerFirstName = document.getElementById("profileHeaderFirstName");
      const headerLastName = document.getElementById("profileHeaderLastName");

      if (headerFirstName) headerFirstName.textContent = user.firstName || "";
      if (headerLastName) headerLastName.textContent = user.lastName || "";

      const firstName = document.getElementById("profileFirstName");
      const lastName = document.getElementById("profileLastName");
      const email = document.getElementById("profileEmail");
      const phone = document.getElementById("profilePhone");

      if (firstName) firstName.textContent = user.firstName || "";
      if (lastName) lastName.textContent = user.lastName || "";
      if (email) email.textContent = user.email || "";
      if (phone) phone.textContent = user.phone || "";

      const profileImage = document.getElementById("profileImage");

      if (profileImage) {
        profileImage.src = user.profileImage
          ? `/images/${user.profileImage}`
          : "/images/default-avatar.png";
      }
    }

    const addressResponse = await fetch(`${API_BASE}/api/addresses/${userId}`);
    const addressData = await addressResponse.json();

    const addressList = document.getElementById("addressList");

    if (!addressList) return;

    addressList.innerHTML = "";

    if (addressResponse.ok && addressData.addresses.length > 0) {
      addressData.addresses.forEach((address) => {
        const div = document.createElement("div");
        div.className = "address-card";

        div.innerHTML = `
          <h4>${address.label}</h4>
          <p>${address.fullName}</p>
          <p>${address.phone}</p>
          <p>${address.line1}</p>
          <p>${address.street}, ${address.city}, ${address.state}</p>
          <p>${address.pincode}, ${address.country}</p>

          <div class="address-actions">
            <button class="edit-btn" onclick="editAddress('${address._id}')">
              Edit
            </button>

            <button class="delete-btn" onclick="deleteAddress('${address._id}')">
              Delete
            </button>
          </div>
        `;

        addressList.appendChild(div);
      });
    } else {
      addressList.innerHTML = "<p>No saved addresses</p>";
    }

  } catch (error) {
    console.error("PROFILE LOAD ERROR:", error);
  }
}

if (document.getElementById("addressList")) {
  loadProfile();
}

if (editId) {
  const formHeading = document.getElementById("formHeading");
  const pageTitle = document.getElementById("pageTitle");
  const submitBtn = document.getElementById("submitBtn");

  if (formHeading) formHeading.textContent = "Edit Address";
  if (pageTitle) pageTitle.textContent = "Edit Address";
  if (submitBtn) submitBtn.textContent = "Update Address";

  loadAddressForEdit(editId);
}

async function loadAddressForEdit(id) {
  try {
    const res = await fetch(`${API_BASE}/api/addresses/${currentUser._id}`);
    const data = await res.json();

    const address = data.addresses.find((a) => a._id === id);

    if (!address) {
      showAlert("Address not found", "danger");
      return;
    }

    document.getElementById("fullName").value = address.fullName || "";
    document.getElementById("phone").value = address.phone || "";
    document.getElementById("line1").value = address.line1 || "";
    document.getElementById("street").value = address.street || "";
    document.getElementById("city").value = address.city || "";
    document.getElementById("state").value = address.state || "";
    document.getElementById("pincode").value = address.pincode || "";
    document.getElementById("label").value = address.label || "Home";
    document.getElementById("isDefault").checked = address.isDefault || false;

  } catch (err) {
    console.error("LOAD EDIT ERROR:", err);
  }
}

// ADDRESS FORM

const addressForm = document.getElementById("addressForm");

if (addressForm) {
  addressForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const body = {
      userId: currentUser._id,
      fullName: document.getElementById("fullName").value,
      phone: document.getElementById("phone").value,
      line1: document.getElementById("line1").value,
      street: document.getElementById("street").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      pincode: document.getElementById("pincode").value,
      country: "India",
      label: document.getElementById("label").value,
      isDefault: document.getElementById("isDefault").checked,
    };

    try {
      let url = `${API_BASE}/api/addresses`;
      let method = "POST";

      if (editId) {
        url = `${API_BASE}/api/addresses/${editId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert(
          editId
            ? "Address updated successfully"
            : "Address saved successfully"
        );

        window.location.href = "/user/profile";
      } else {
        showAlert(data.message || "Failed to save address", "danger");
      }

    } catch (err) {
      console.error(err);
      showAlert("Error saving address", "danger");
    }
  });
}

// DELETE ADDRESS

async function deleteAddress(addressId) {
  const confirmDelete = confirm("Delete this address?");

  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_BASE}/api/addresses/${addressId}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (res.ok) {
      showAlert("Address deleted");
      loadProfile();
    } else {
      showAlert(data.message || "Delete failed", "danger");
    }

  } catch (error) {
    console.error("DELETE ERROR:", error);
    showAlert("Something went wrong", "danger");
  }
}

function editAddress(id) {
  window.location.href = `/user/addresses?edit=${id}`;
}

// EDIT PROFILE

async function loadEditProfile() {
  if (!currentUser) return;

  try {
    const res = await fetch(
      `${API_BASE}/api/users/profile/${currentUser._id}`
    );

    const data = await res.json();

    if (!data.user) return;

    const firstName = document.getElementById("editFirstName");
    const lastName = document.getElementById("editLastName");
    const email = document.getElementById("editEmail");
    const phone = document.getElementById("editPhone");

    if (firstName) firstName.value = data.user.firstName || "";
    if (lastName) lastName.value = data.user.lastName || "";
    if (email) email.value = data.user.email || "";
    if (phone) phone.value = data.user.phone || "";

  } catch (error) {
    console.error("LOAD EDIT PROFILE ERROR:", error);
  }
}

async function saveProfile() {

  if (!currentUser) return;

  try {

    const firstName =
      document.getElementById("editFirstName").value.trim();

    const lastName =
      document.getElementById("editLastName").value.trim();

    const phone =
      document.getElementById("editPhone").value.trim();

    const email =
      document.getElementById("editEmail").value.trim();

    // OLD EMAIL
    const oldEmail = currentUser.email;

    // IF EMAIL CHANGED -> SEND OTP
    if (email !== oldEmail) {

      // STORE UPDATED DATA TEMPORARILY
      localStorage.setItem(
        "pendingProfileUpdate",

        JSON.stringify({
          firstName,
          lastName,
          phone,
          email
        })
      );

      // SEND OTP
      const otpRes = await fetch(
        `${API_BASE}/api/otp/send`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            purpose: "emailChange"
          })
        }
      );

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        showAlert(
          otpData.message || "Failed to send OTP",
          "danger"
        );

        return;
      }

      // SAVE EMAIL TO VERIFY LATER
      localStorage.setItem("pendingEmail", email);

      // GO TO OTP PAGE
      window.location.href = "/user/emailotp";

      return;
    }

    
    const res = await fetch(
      `${API_BASE}/api/users/profile/${currentUser._id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email
        })
      }
    );

    const data = await res.json();

    if (res.ok) {

      currentUser.firstName = firstName;
      currentUser.lastName = lastName;
      currentUser.phone = phone;
      currentUser.email = email;

      localStorage.setItem(
        "user",
        JSON.stringify(currentUser)
      );

      showAlert("Profile updated successfully");

      window.location.href =
        "/user/profile";

    } else {

      showAlert(
        data.message || "Update failed",
        "danger"
      );

    }

  } catch (error) {

    console.error("SAVE PROFILE ERROR:", error);

    showAlert(
      "Something went wrong",
      "danger"
    );

  }
}

if (document.getElementById("editFirstName")) {
  loadEditProfile();
}

async function changePassword() {
  if (!currentUser) return;

  const currentPassword = document.getElementById("currentPassword").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    showAlert("Please fill all fields", "warning");
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert("New passwords do not match", "warning");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/users/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: currentUser._id,
        currentPassword,
        newPassword
      })
    });

    const data = await res.json();

    if (res.ok) {
      showAlert("Password changed successfully");

      localStorage.removeItem("user");
      window.location.href = "/login";
    } else {
      showAlert(data.message || "Password change failed", "danger");
    }

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    showAlert("Something went wrong", "danger");
  }
}
// EMAIL CHANGE OTP VERIFY

if (document.getElementById("emailOtpForm")) {

  const otpForm =
    document.getElementById("emailOtpForm");

  const resendBtn =
    document.getElementById("resendEmailOtpBtn");

  const timerText =
    document.getElementById("otpTimer");

  let timer = 30;

  function startTimer() {

    resendBtn.style.display = "none";

    const interval = setInterval(() => {

      timerText.textContent =
        `Resend OTP in ${timer}s`;

      timer--;

      if (timer < 0) {

        clearInterval(interval);

        timerText.textContent =
          "OTP expired";

        resendBtn.style.display =
          "inline-block";
      }

    }, 1000);
  }

  startTimer();

  otpForm.addEventListener(
    "submit",

    async (e) => {

      e.preventDefault();

      const otp =
        document
          .getElementById("emailOtp")
          .value
          .trim();

      const email =
        localStorage.getItem("pendingEmail");

      const pendingData =
        JSON.parse(
          localStorage.getItem(
            "pendingProfileUpdate"
          )
        );

      if (!otp) {

        showAlert(
          "Please enter OTP",
          "warning"
        );

        return;
      }

      try {

        // VERIFY OTP
        const verifyRes = await fetch(
          `${API_BASE}/api/otp/verify`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              otp,
              purpose: "emailChange"
            })
          }
        );

        const verifyData =
          await verifyRes.json();

        if (
          !verifyRes.ok ||
          !verifyData.verified
        ) {

          showAlert(
            verifyData.message ||
            "Invalid OTP",
            "danger"
          );

          return;
        }

        // UPDATE PROFILE
        const updateRes = await fetch(
          `${API_BASE}/api/users/profile/${currentUser._id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify(
              pendingData
            )
          }
        );

        const updateData =
          await updateRes.json();

        if (updateRes.ok) {

          currentUser.firstName =
            pendingData.firstName;

          currentUser.lastName =
            pendingData.lastName;

          currentUser.phone =
            pendingData.phone;

          currentUser.email =
            pendingData.email;

          localStorage.setItem(
            "user",
            JSON.stringify(currentUser)
          );

          localStorage.removeItem(
            "pendingProfileUpdate"
          );

          localStorage.removeItem(
            "pendingEmail"
          );

          showAlert(
            "Email updated successfully"
          );

          setTimeout(() => {

            window.location.href =
              "/user/profile";

          }, 1000);

        } else {

          showAlert(
            updateData.message ||
            "Update failed",
            "danger"
          );

        }

      } catch (error) {

        console.error(error);

        showAlert(
          "Something went wrong",
          "danger"
        );

      }

    }
  );

  resendBtn.addEventListener(
    "click",

    async () => {

      const email =
        localStorage.getItem(
          "pendingEmail"
        );

      try {

        await fetch(
          `${API_BASE}/api/otp/send`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              purpose: "emailChange"
            })
          }
        );

        timer = 30;

        startTimer();

        showAlert(
          "OTP resent successfully"
        );

      } catch (error) {

        console.error(error);

      }

    }
  );

}

// LOGOUT

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    localStorage.removeItem("user");

    window.location.href = "/auth/logout";
  });
}

function logoutUser() {
  localStorage.removeItem("user");

  window.location.href = "/auth/logout";
}