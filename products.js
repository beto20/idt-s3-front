import { state, $, price, element, setStatus } from "./lib.js";
import { getProducts, registerProduct, serviceError } from "./api.js";
import { addToCart, renderCart } from "./orders.js";

export async function loadProducts() {
  setStatus("#product-status", "Cargando productos…");
  try {
    const data = await getProducts();
    if (!Array.isArray(data)) throw new Error("La respuesta de productos no es una lista.");
    state.products = data;
    renderProducts();
    renderCart();
    $("#product-count").textContent = data.length;
    setStatus("#product-status", "");
  } catch (error) {
    setStatus("#product-status", serviceError(error, "productos"), true);
  }
}

function renderProducts() {
  const list = $("#product-list");
  list.replaceChildren();
  if (!state.products.length) {
    list.append(element("p", "empty-state", "Todavía no hay productos."));
    return;
  }
  state.products.forEach((product) => {
    const card = element("article", "product-card");
    card.append(element("div", "product-icon", (product.name || "P").charAt(0).toUpperCase()));
    const info = element("div", "product-info");
    info.append(element("h3", "", product.name), element("p", "", product.description),
      element("p", "stock", `${product.stock} en stock`));
    const side = element("div", "product-side");
    const add = element("button", "small-button", product.stock > 0 ? "Añadir +" : "Agotado");
    add.type = "button";
    add.disabled = product.stock <= 0;
    add.addEventListener("click", () => addToCart(product));
    side.append(element("strong", "", price(product.price)), add);
    card.append(info, side);
    list.append(card);
  });
}

export function initProducts() {
$("#product-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const product = {
    name: String(data.get("name")).trim(),
    description: String(data.get("description")).trim(),
    stock: Number(data.get("stock")),
    price: Number(data.get("price")),
  };
  if (!product.name || !product.description || !Number.isInteger(product.stock) || product.stock < 0 || !Number.isFinite(product.price) || product.price <= 0) {
    setStatus("#product-form-status", "Completa los datos del producto con valores válidos.", true);
    return;
  }
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  setStatus("#product-form-status", "Guardando producto…");
  try {
    const saved = await registerProduct(product);
    if (saved !== true) throw new Error("El servicio rechazó el producto.");
    form.reset();
    await loadProducts();
    setStatus("#product-form-status", "Producto registrado correctamente.");
  } catch (error) {
    setStatus("#product-form-status", serviceError(error, "productos"), true);
  } finally {
    submit.disabled = false;
  }
});

$("#reload-products").addEventListener("click", loadProducts);
}
