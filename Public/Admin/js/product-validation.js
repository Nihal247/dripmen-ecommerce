export function validateProductForm() {

  const name = document.getElementById("prodName").value.trim();
  const description = document.getElementById("prodDescription").value.trim();
  const price = document.getElementById("prodPrice").value;
  const salePrice = document.getElementById("prodSalePrice").value;
  const category = document.getElementById("prodCategory").value;
  const stock = document.getElementById("prodStock").value;
  const images = document.getElementById("prodImages").files;

  if (!name || name.length < 3) {
    alert("Product name must be at least 3 characters");
    return false;
  }

  if (!description || description.length < 10) {
    alert("Description must be at least 10 characters");
    return false;
  }

  if (!price || price <= 0) {
    alert("Price must be greater than 0");
    return false;
  }

  if (salePrice && Number(salePrice) >= Number(price)) {
    alert("Sale price must be less than regular price");
    return false;
  }

  if (!category) {
    alert("Please select a category");
    return false;
  }

  if (stock < 0) {
    alert("Stock cannot be negative");
    return false;
  }

  if (images.length > 5) {
    alert("Maximum 5 images allowed");
    return false;
  }

  for (const file of images) {

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return false;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Each image must be less than 2MB");
      return false;
    }

  }

  return true;
}