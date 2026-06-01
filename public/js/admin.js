const API_BASE = "http://localhost:3000";

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

// =========================
// ADMIN SESSION PROTECTION
// =========================
if (window.location.pathname === "/admin") {

  const admin = localStorage.getItem("admin");

  if (!admin) {
    window.location.replace("/admin/login");
  }

  window.addEventListener("pageshow", function (event) {

    if (event.persisted || !localStorage.getItem("admin")) {
      window.location.replace("/admin/login");
    }

  });
}

// =========================
// ADMIN LOGIN
// =========================
const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {

  adminLoginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    const errorEl = document.getElementById("adminLoginError");

    errorEl.textContent = "";

    try {

      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {

        localStorage.setItem("admin", JSON.stringify(data.admin));

        showAlert("Login successful");

        setTimeout(() => {
          window.location.href = "/admin";
        }, 1000);

      } else {

        errorEl.textContent = data.message || "Login failed";

      }

    } catch (error) {

      console.error("ADMIN LOGIN ERROR:", error);

      errorEl.textContent = "Something went wrong";

    }

  });

}

// =========================
// SHOW SECTION
// =========================
function showSection(sectionId) {

  document.querySelectorAll("main section").forEach((section) => {
    section.style.display = "none";
  });

  document.getElementById(sectionId).style.display = "block";

  document.querySelectorAll(".admin-menu li").forEach((item) => {
    item.classList.remove("active");
  });

  const clickedItem = Array.from(
    document.querySelectorAll(".admin-menu li")
  ).find((item) =>
    item.getAttribute("onclick")?.includes(sectionId)
  );

  if (clickedItem) {
    clickedItem.classList.add("active");
  }
}

// =========================
// LOAD USERS
// =========================
async function loadUsers(page = 1) {

  const usersTableBody = document.getElementById("usersTableBody");

  if (!usersTableBody) return;

  const searchInput = document.getElementById("searchInput");

  const search = searchInput
    ? searchInput.value.trim()
    : "";

  try {

    const res = await fetch(
      `${API_BASE}/admin/users?page=${page}&search=${search}`
    );

    const data = await res.json();

    usersTableBody.innerHTML = "";

    if (!data.users || data.users.length === 0) {

      usersTableBody.innerHTML = `
        <tr>
          <td colspan="4">No users found</td>
        </tr>
      `;

      return;
    }

    data.users.forEach((user) => {

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${user.firstName} ${user.lastName || ""}</td>
        <td>${user.email}</td>
        <td>${user.isBlocked ? "Blocked" : "Active"}</td>

        <td>
          <button
            class="${user.isBlocked ? "unblock-btn" : "block-btn"}"
            onclick="toggleBlock('${user._id}', ${user.isBlocked})"
          >
            ${user.isBlocked ? "Unblock" : "Block"}
          </button>
        </td>
      `;

      usersTableBody.appendChild(row);

    });

    const pagination = document.getElementById("pagination");

    if (pagination) {

      pagination.innerHTML = "";

      if (data.hasPrevPage) {

        pagination.innerHTML += `
          <button onclick="loadUsers(${page - 1})">
            Prev
          </button>
        `;

      }

      pagination.innerHTML += `
        <span>
          Page ${data.currentPage} of ${data.totalPages}
        </span>
      `;

      if (data.hasNextPage) {

        pagination.innerHTML += `
          <button onclick="loadUsers(${page + 1})">
            Next
          </button>
        `;

      }

    }

  } catch (error) {

    console.error("LOAD USERS ERROR:", error);

    showAlert("Failed to load users", "danger");

  }

}

// =========================
// CLEAR SEARCH
// =========================
function clearSearch() {

  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.value = "";
  }

  loadUsers(1);
}

// =========================
// BLOCK / UNBLOCK USER
// =========================
async function toggleBlock(userId, isBlocked) {

  const action = isBlocked
    ? "unblock"
    : "block";

  const confirmAction = confirm(
    `Are you sure you want to ${action} this user?`
  );

  if (!confirmAction) return;

  try {

    const res = await fetch(
      `${API_BASE}/admin/users/${userId}/toggle-block`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      }
    );

    const data = await res.json();

    if (res.ok) {

      showAlert(
        `User ${action}ed successfully`,
        "success"
      );

      loadUsers();

    } else {

      showAlert(
        data.message || "Action failed",
        "danger"
      );

    }

  } catch (error) {

    console.error("TOGGLE BLOCK ERROR:", error);

    showAlert("Something went wrong", "danger");

  }

}

// =========================
// ADMIN LOGOUT
// =========================
function adminLogout() {

  localStorage.removeItem("admin");

  showAlert("Logged out successfully");

  setTimeout(() => {
    window.location.href = "/admin/login";
  }, 1000);

}

// =========================
// INITIAL LOAD
// =========================
if (document.getElementById("usersTableBody")) {
  loadUsers();
}

// =========================
// CATEGORY MANAGEMENT
// =========================


async function loadCategories(page = 1) {

  const categoryContainer =
    document.getElementById("categoryContainer");

  if (!categoryContainer) return;

  try {

    const searchInput =
  document.getElementById(
    "categorySearchInput"
  );

const search =
  searchInput
    ? searchInput.value.trim()
    : "";

const response = await fetch(
  `${API_BASE}/admin/categories?page=${page}&search=${search}`
);

    const data = await response.json();
    console.log(data);

    categoryContainer.innerHTML = "";

    if (!data.categories || data.categories.length === 0) {
      categoryContainer.innerHTML = "<p>No categories found</p>";
      return;
    }
    
    data.categories.forEach((category) => {
    
      categoryContainer.innerHTML += `
    
        <div class="category-card">
    
          <h3>${category.name}</h3>
    
          <p>
            ${category.description || "No description"}
          </p>
    
          <div class="category-actions">
    
            <button
              onclick="window.location.href='/admin/edit-category?id=${category._id}'"
            >
              Edit
            </button>
    
            <button
              onclick="deleteCategory('${category._id}')"
            >
              Delete
            </button>
    
          </div>
    
        </div>
    
      `;
    
    });
    const pagination =
  document.getElementById(
    "categoryPagination"
  );

if (pagination) {

  pagination.innerHTML = "";

  if (data.hasPrevPage) {

    pagination.innerHTML += `
      <button onclick="loadCategories(${page - 1})">
        Prev
      </button>
    `;

  }

  pagination.innerHTML += `
    <span>
      Page ${data.currentPage}
      of
      ${data.totalPages}
    </span>
  `;

  if (data.hasNextPage) {

    pagination.innerHTML += `
      <button onclick="loadCategories(${page + 1})">
        Next
      </button>
    `;

  }

}

  } catch (error) {

    console.log(
      "LOAD CATEGORY ERROR:",
      error
    );

  }

}

async function deleteCategory(id) {

  const confirmDelete =
    confirm("Delete category?");

  if (!confirmDelete) return;

  try {

    const response = await fetch(
      `${API_BASE}/admin/categories/delete/${id}`,
      {
        method: "PATCH"
      }
    );

    const data = await response.json();

    showAlert(data.message,"success");

    loadCategories();

  } catch (error) {

    console.log(
      "DELETE CATEGORY ERROR:",
      error
    );

  }

}


const editForm = document.getElementById("editCategoryForm");

if (editForm) {

  const params = new URLSearchParams(window.location.search);

  const categoryId = params.get("id");

  async function loadCategory() {

    const response = await fetch("http://localhost:3000/admin/categories");

    const data = await response.json();

    const category = data.categories.find(
      cat => cat._id === categoryId
    );

    if (!category) return;

    document.getElementById("categoryName").value = category.name;

    document.getElementById("categoryDescription").value =
      category.description;
  }

  loadCategory();

  editForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("categoryName").value;

    const description =
      document.getElementById("categoryDescription").value;

    const response = await fetch(
      `http://localhost:3000/admin/categories/${categoryId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description
        })
      }
    );

    const data = await response.json();

    alert(data.message);

    window.location.href = "/admin/category";
  });

}
if (document.getElementById("categoryContainer")) {
  loadCategories();
}
const addCategoryForm =
  document.getElementById("addCategoryForm");

if (addCategoryForm) {

  addCategoryForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const name =
        document.getElementById("categoryName").value;

      const description =
        document.getElementById("categoryDescription").value;

      try {

        const response = await fetch(
          `${API_BASE}/admin/categories`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              name,
              description
            })
          }
        );

        const data = await response.json();

        alert(data.message);

        if (response.ok) {

          window.location.href =
            "/admin/category";

        }

      } catch (error) {

        console.log(
          "ADD CATEGORY ERROR:",
          error
        );

      }

    }
  );

}
// =========================
// LOAD BRANDS
// =========================

async function loadBrands(page = 1) {

  const brandContainer =
    document.getElementById("brandContainer");

  if (!brandContainer) return;

  const searchInput =
    document.getElementById("brandSearchInput");

  const search =
    searchInput
      ? searchInput.value.trim()
      : "";

  try {

    const response = await fetch(
      `${API_BASE}/admin/brands?page=${page}&search=${search}`
    );

    const data = await response.json();

    brandContainer.innerHTML = "";

    data.brands.forEach((brand) => {

      brandContainer.innerHTML += `

        <div class="category-card">

          <h3>${brand.brandName}</h3>

          <p>
            ${brand.description}
          </p>

          <div class="category-actions">

            <button
              onclick="window.location.href='/admin/edit-brand?id=${brand._id}'"
            >
              Edit
            </button>

            <button
              onclick="toggleBrandStatus('${brand._id}')"
            >
              ${brand.isBlocked
                ? "Unblock"
                : "Block"}
            </button>

            <button
              onclick="deleteBrand('${brand._id}')"
            >
              Delete
            </button>

          </div>

        </div>

      `;

    });

  } catch (error) {

    console.log(
      "LOAD BRANDS ERROR:",
      error
    );

  }

}


// =========================
// CLEAR SEARCH
// =========================

function clearBrandSearch() {

  const input =
    document.getElementById(
      "brandSearchInput"
    );

  if (input) {

    input.value = "";

  }

  loadBrands();

}


// =========================
// TOGGLE BRAND STATUS
// =========================

async function toggleBrandStatus(id) {

  try {

    const response = await fetch(
      `${API_BASE}/admin/brands/${id}/status`,
      {
        method: "PATCH"
      }
    );

    const data = await response.json();

    alert(data.message);

    loadBrands();

  } catch (error) {

    console.log(
      "TOGGLE BRAND ERROR:",
      error
    );

  }

}


// =========================
// ADD BRAND
// =========================

// =========================
// ADD BRAND
// =========================

const addBrandForm =
  document.getElementById(
    "addBrandForm"
  );

if (addBrandForm) {

  addBrandForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const brandName =
        document.getElementById(
          "brandName"
        ).value;

      const description =
        document.getElementById(
          "brandDescription"
        ).value;

      try {

        const response = await fetch(
          `${API_BASE}/admin/brands`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              brandName,
              description
            })
          }
        );

        const data =
          await response.json();

        if (response.ok) {

          alert(data.message);

          window.location.href =
            "/admin/brands-page";

        } else {

          alert(data.message);

        }

      } catch (error) {

        console.log(
          "ADD BRAND ERROR:",
          error
        );

      }

    }
  );

}


// INITIAL LOAD

if (
  document.getElementById(
    "brandContainer"
  )
) {

  loadBrands();

}
// =========================
// EDIT BRAND
// =========================

const editBrandForm =
  document.getElementById(
    "editBrandForm"
  );

if (editBrandForm) {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const brandId =
    params.get("id");

  async function loadBrand() {

    const response = await fetch(
      `${API_BASE}/admin/brands`
    );

    const data =
      await response.json();

    const brand =
      data.brands.find(
        b => b._id === brandId
      );

    if (!brand) return;

    document.getElementById(
      "editBrandName"
    ).value = brand.brandName;

    document.getElementById(
      "editBrandDescription"
    ).value = brand.description;

  }

  loadBrand();

  editBrandForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      const brandName =
        document.getElementById(
          "editBrandName"
        ).value;

      const description =
        document.getElementById(
          "editBrandDescription"
        ).value;

      try {

        const response = await fetch(
          `${API_BASE}/admin/brands/${brandId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              brandName,
              description
            })
          }
        );

        const data =
          await response.json();

        alert(data.message);

        window.location.href =
          "/admin/brands-page";

      } catch (error) {

        console.log(
          "EDIT BRAND ERROR:",
          error
        );

      }

    }
  );

}
async function deleteBrand(id) {

  const confirmDelete =
    confirm("Delete brand?");

  if (!confirmDelete) return;

  try {

    const response = await fetch(
      `${API_BASE}/admin/brands/delete/${id}`,
      {
        method: "PATCH"
      }
    );

    const data =
      await response.json();

    alert(data.message);

    loadBrands();

  } catch (error) {

    console.log(
      "DELETE BRAND ERROR:",
      error
    );

  }

}
// =========================
// LOAD PRODUCTS
// =========================

async function loadProducts(page = 1) {

  const productContainer =
    document.getElementById(
      "productContainer"
    );

  if (!productContainer) return;

  const searchInput =
    document.getElementById(
      "productSearchInput"
    );

  const search =
    searchInput
      ? searchInput.value.trim()
      : "";

  try {

    const response = await fetch(
      `${API_BASE}/admin/products?page=${page}&search=${search}`
    );

    const data =
      await response.json();

    productContainer.innerHTML = "";

    data.products.forEach((product) => {

      productContainer.innerHTML += `

        <div class="category-card">

          <h3>
            ${product.productName}
          </h3>

          <p>
            ${product.description}
          </p>

          <p>
            Brand:
            ${product.brand?.brandName}
          </p>

          <p>
            Category:
            ${product.category?.name}
          </p>

          <p>
            ₹${product.variants?.[0]?.price || 0}
          </p>

          <p>
            Stock:
            ${product.variants?.[0]?.stock || 0}
          </p>

          <div class="category-actions">

            <button
              onclick="window.location.href='/admin/edit-product?id=${product._id}'"
            >
              Edit
            </button>

            <button
              onclick="deleteProduct('${product._id}')"
            >
              Delete
            </button>

          </div>

        </div>

      `;

    });

  } catch (error) {

    console.log(
      "LOAD PRODUCTS ERROR:",
      error
    );

  }

}
function clearProductSearch() {
  const searchInput =
  document.getElementById(
    "productSearchInput"
  );
  if (searchInput) {
    searchInput.value = "";
  }
  loadProducts(1);
}

// =========================
// INITIAL LOAD
// =========================

if (
  document.getElementById(
    "productContainer"
  )
) {

  loadProducts();

}
// =========================
// LOAD CATEGORY DROPDOWN
// =========================

async function loadCategoryDropdown() {

  const categorySelect =
    document.getElementById(
      "productCategory"
    );

  if (!categorySelect) return;

  try {

    const response = await fetch(
      `${API_BASE}/admin/categories`
    );

    const data =
      await response.json();

    data.categories.forEach(
      (category) => {

        categorySelect.innerHTML += `

          <option value="${category._id}">
            ${category.name}
          </option>

        `;

      }
    );

  } catch (error) {

    console.log(
      "CATEGORY DROPDOWN ERROR:",
      error
    );

  }

}

// =========================
// LOAD BRAND DROPDOWN
// =========================

async function loadBrandDropdown() {

  const brandSelect =
    document.getElementById(
      "productBrand"
    );

  if (!brandSelect) return;

  try {

    const response = await fetch(
      `${API_BASE}/admin/brands`
    );

    const data =
      await response.json();

    data.brands.forEach(
      (brand) => {

        brandSelect.innerHTML += `

          <option value="${brand._id}">
            ${brand.brandName}
          </option>

        `;

      }
    );

  } catch (error) {

    console.log(
      "BRAND DROPDOWN ERROR:",
      error
    );

  }

}
if (
  document.getElementById(
    "productCategory"
  )
) {

  loadCategoryDropdown();

}

if (
  document.getElementById(
    "productBrand"
  )
) {

  loadBrandDropdown();

}
let variants = [];

function addVariant() {

  const size =
    document.getElementById(
      "variantSize"
    ).value;

  const color =
    document.getElementById(
      "variantColor"
    ).value;

  const price =
    document.getElementById(
      "variantPrice"
    ).value;

  const stock =
    document.getElementById(
      "variantStock"
    ).value;

  if (
    !size ||
    !color ||
    !price ||
    !stock
  ) {

    showAlert(
      "Fill all variant fields"
    );

    return;

  }

  variants.push({

    size,
    color,
    price,
    stock

  });

  renderVariants();

  document.getElementById(
    "variantSize"
  ).value = "";

  document.getElementById(
    "variantColor"
  ).value = "";

  document.getElementById(
    "variantPrice"
  ).value = "";

  document.getElementById(
    "variantStock"
  ).value = "";

}

function renderVariants() {

  const variantList =
    document.getElementById(
      "variantList"
    );

  if (!variantList) return;

  variantList.innerHTML = "";

  variants.forEach(
    (variant, index) => {

      variantList.innerHTML += `

        <div class="variant-card">

          <p>
            Size:
            ${variant.size}
          </p>

          <p>
            Color:
            ${variant.color}
          </p>

          <p>
            Price:
            ₹${variant.price}
          </p>

          <p>
            Stock:
            ${variant.stock}
          </p>

          <div class="category-actions">

            <button
              onclick="removeVariant(${index})"
            >
              Remove
            </button>

          </div>

        </div>

      `;

    }
  );

}

function removeVariant(index) {

  variants.splice(index, 1);

  renderVariants();

}

// =========================
// ADD PRODUCT
// =========================

const addProductForm =
  document.getElementById(
    "addProductForm"
  );

if (addProductForm) {

  addProductForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      try {

        const productName =
          document.getElementById(
            "productName"
          ).value;

        const description =
          document.getElementById(
            "productDescription"
          ).value;

        const category =
          document.getElementById(
            "productCategory"
          ).value;

        const brand =
          document.getElementById(
            "productBrand"
          ).value;

        if (variants.length === 0) {

          showAlert(
            "Add at least one variant"
          );

          return;

        }

        const formData =
  new FormData();

formData.append(
  "productName",
  productName
);

formData.append(
  "description",
  description
);

formData.append(
  "category",
  category
);

formData.append(
  "brand",
  brand
);

formData.append(
  "variants",
  JSON.stringify(variants)
);

const images =
  document.getElementById(
    "productImages"
  ).files;

for (
  let i = 0;
  i < images.length;
  i++
) {

  formData.append(
    "images",
    images[i]
  );

}

const response =
  await fetch(
    `${API_BASE}/admin/products`,
    {

      method: "POST",

      body: formData

    }
  );

        const data =
          await response.json();

        if (response.ok) {

          showAlert(
            "Product added successfully"
          );

          window.location.href =
            "/admin/products-page";

        } else {

          alert(data.message);

        }

      } catch (error) {

        console.log(
          "ADD PRODUCT FRONTEND ERROR:",
          error
        );

      }

    }
  );

}
const editProductForm =
  document.getElementById(
    "editProductForm"
  );

let existingImages = [];

if (editProductForm) {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const productId =
    params.get("id");

  loadEditProduct();

  function renderExistingImages() {

    const existingImagesContainer =
      document.getElementById(
        "existingImages"
      );

    if (!existingImagesContainer) return;

    existingImagesContainer.innerHTML = "";

    existingImages.forEach(
      (image, index) => {

        existingImagesContainer.innerHTML += `

          <div
            style="
              display:inline-block;
              margin:10px;
            "
          >

            <img
              src="${image}"
              width="120"
              style="
                border-radius:8px;
                display:block;
                margin-bottom:8px;
              "
            />

            <button
              type="button"
              onclick="removeExistingImage(${index})"
            >
              Remove
            </button>

          </div>

        `;

      }
    );

  }

  window.removeExistingImage =
    function(index) {

      existingImages.splice(index, 1);

      renderExistingImages();

    };

  async function loadEditProduct() {

    try {

      const response =
        await fetch(
          `${API_BASE}/admin/products/${productId}`
        );

      const data =
        await response.json();

      const product =
        data.product;

      document.getElementById(
        "productName"
      ).value =
        product.productName;

      document.getElementById(
        "productDescription"
      ).value =
        product.description;

      await loadCategoryDropdown();

      await loadBrandDropdown();

      document.getElementById(
        "productCategory"
      ).value =
        product.category?._id || product.category;

      document.getElementById(
        "productBrand"
      ).value =
        product.brand?._id || product.brand;

      variants =
        product.variants || [];

      renderVariants();

      existingImages =
        product.images || [];

      renderExistingImages();

    } catch (error) {

      console.log(
        "LOAD PRODUCT ERROR:",
        error
      );

    }

  }

  editProductForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      try {

        const productName =
          document.getElementById(
            "productName"
          ).value;

        const description =
          document.getElementById(
            "productDescription"
          ).value;

        const category =
          document.getElementById(
            "productCategory"
          ).value;

        const brand =
          document.getElementById(
            "productBrand"
          ).value;

        const formData =
          new FormData();

        formData.append(
          "productName",
          productName
        );

        formData.append(
          "description",
          description
        );

        formData.append(
          "category",
          category
        );

        formData.append(
          "brand",
          brand
        );

        formData.append(
          "variants",
          JSON.stringify(variants)
        );

        formData.append(
          "existingImages",
          JSON.stringify(existingImages)
        );

        const images =
          document.getElementById(
            "productImages"
          ).files;

        for (
          let i = 0;
          i < images.length;
          i++
        ) {

          formData.append(
            "images",
            images[i]
          );

        }

        const response =
          await fetch(
            `${API_BASE}/admin/products/${productId}`,
            {
              method: "PATCH",
              body: formData
            }
          );

        const data =
          await response.json();

        alert(data.message);

        window.location.href =
          "/admin/products-page";

      } catch (error) {

        console.log(
          "EDIT PRODUCT ERROR:",
          error
        );

      }

    }
  );

}

async function deleteProduct(id) {

  const confirmDelete =
    confirm(
      "Delete this product?"
    );

  if (!confirmDelete) return;

  try {

    const response =
      await fetch(
        `${API_BASE}/admin/products/delete/${id}`,
        {
          method: "PATCH"
        }
      );

    const data =
      await response.json();

    showAlert(data.message,"success");

    loadProducts();

  } catch (error) {

    console.log(
      "DELETE PRODUCT ERROR:",
      error
    );

  }

}
