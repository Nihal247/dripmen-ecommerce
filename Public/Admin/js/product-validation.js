export function validateProductForm() {
  const nameInput = document.getElementById("prodName");
  const priceInput = document.getElementById("prodPrice");
  const salePriceInput = document.getElementById("prodSalePrice");
  const categoryInput = document.getElementById("prodCategory");
  const stockInput = document.getElementById("prodStock");
  
  const name = nameInput.value.trim();
  const description = document.getElementById("prodDescription").value.trim();
  const price = priceInput.value;
  const salePrice = salePriceInput.value;
  const category = categoryInput.value;
  const stock = stockInput.value;
  const images = document.getElementById("prodImages").files;

  // Reset styles
  [nameInput, priceInput, salePriceInput, categoryInput, stockInput].forEach(el => el.style.border = "1px solid #e9ecef");

  if (!name || name.length < 3) {
    alert("Product name must be at least 3 characters long.");
    nameInput.style.border = "1px solid #ef4444";
    nameInput.focus();
    return false;
  }

  const nameRegex = /^[a-zA-Z0-9\s\-\(\)]+$/;
  if (!nameRegex.test(name)) {
    alert("Product name contains invalid characters. Please use only letters, numbers, spaces, and hyphens.");
    nameInput.style.border = "1px solid #ef4444";
    nameInput.focus();
    return false;
  }

  if (!description || description.length < 10) {
    alert("Description must be at least 10 characters long.");
    return false;
  }

  if (!price || Number(price) <= 0) {
    alert("Price must be a positive number greater than 0.");
    priceInput.style.border = "1px solid #ef4444";
    priceInput.focus();
    return false;
  }

  if (salePrice && Number(salePrice) < 0) {
    alert("Sale price cannot be negative.");
    salePriceInput.style.border = "1px solid #ef4444";
    salePriceInput.focus();
    return false;
  }

  if (salePrice && Number(salePrice) >= Number(price)) {
    alert("Sale price must be less than the regular price.");
    salePriceInput.style.border = "1px solid #ef4444";
    salePriceInput.focus();
    return false;
  }

  if (!category) {
    alert("Please select a category.");
    categoryInput.style.border = "1px solid #ef4444";
    return false;
  }

  let allSizesValid = true;
  document.querySelectorAll(".size-qty").forEach(input => {
    if (Number(input.value) < 0) {
      allSizesValid = false;
      input.style.border = "1px solid #ef4444";
    }
  });

  if (!allSizesValid) {
    alert("Stock quantities cannot be negative.");
    return false;
  }

  if (Number(stock) < 0) {
    alert("Total stock cannot be negative.");
    return false;
  }

  const isEdit = !!document.getElementById("productId").value;
  const currentImagesCount = document.querySelectorAll(".current-image-item").length;

  if (!isEdit && images.length === 0) {
    alert("Please select at least one image for the product.");
    return false;
  }

  if (images.length + currentImagesCount > 5) {
    alert("Maximum 5 images allowed per product.");
    return false;
  }

  for (const file of images) {
    if (!file.type.startsWith("image/")) {
      alert(`File "${file.name}" is not an image.`);
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert(`Image "${file.name}" exceeds the 2MB limit.`);
      return false;
    }
  }

  return true;
}