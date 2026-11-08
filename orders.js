import { state, $, price, element, setStatus } from "./lib.js";
import { getOrders, registerOrder, serviceError } from "./api.js";

export async function loadOrders() {
  setStatus("#order-status", "Cargando órdenes…");
  try {
    const data = await getOrders();
    if (!Array.isArray(data)) throw new Error("La respuesta de órdenes no es una lista.");
    state.orders = data;
    renderOrders();
    $("#order-count").textContent = data.length;
    $("#history-count").textContent = `${data.length} en total`;
    setStatus("#order-status", "");
  } catch (error) {
    setStatus("#order-status", serviceError(error, "órdenes"), true);
  }
}

export function addToCart(product) {
  const current = state.cart.get(product.id);
  if ((current?.quantity || 0) >= product.stock) {
    setStatus("#order-form-status", "No hay más unidades disponibles de este producto.", true);
    return;
  }
  state.cart.set(product.id, { product, quantity: (current?.quantity || 0) + 1 });
  setStatus("#order-form-status", "");
  renderCart();
}

function changeQuantity(id, delta) {
  const item = state.cart.get(id);
  if (!item) return;
  const next = item.quantity + delta;
  if (next <= 0) state.cart.delete(id);
  else if (next <= item.product.stock) item.quantity = next;
  renderCart();
}

export function renderCart() {
  const list = $("#cart-list");
  list.replaceChildren();
  const items = [...state.cart.values()];
  let count = 0;
  let total = 0;
  if (!items.length) list.append(element("p", "empty-cart", "Tu orden está vacía. Añade productos desde el catálogo."));
  items.forEach(({ product, quantity }) => {
    count += quantity;
    total += product.price * quantity;
    const row = element("div", "cart-row");
    const name = element("div", "cart-row-name", product.name);
    name.append(element("small", "", `${price(product.price)} c/u`));
    const controls = element("div", "quantity-controls");
    const minus = element("button", "", "−");
    minus.type = "button";
    minus.setAttribute("aria-label", `Quitar una unidad de ${product.name}`);
    minus.addEventListener("click", () => changeQuantity(product.id, -1));
    const plus = element("button", "", "+");
    plus.type = "button";
    plus.disabled = quantity >= product.stock;
    plus.setAttribute("aria-label", `Añadir una unidad de ${product.name}`);
    plus.addEventListener("click", () => changeQuantity(product.id, 1));
    controls.append(minus, element("span", "", quantity), plus);
    const remove = element("button", "remove-button", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Eliminar ${product.name} de la orden`);
    remove.addEventListener("click", () => { state.cart.delete(product.id); renderCart(); });
    row.append(name, controls, remove);
    list.append(row);
  });
  $("#cart-count").textContent = `${count} ${count === 1 ? "artículo" : "artículos"}`;
  $("#cart-total").textContent = price(total);
  $("#submit-order").disabled = count === 0;
}

function renderOrders() {
  const list = $("#order-list");
  list.replaceChildren();
  if (!state.orders.length) {
    list.append(element("p", "empty-state", "Todavía no hay órdenes."));
    return;
  }
  [...state.orders].reverse().forEach((order) => {
    const card = element("article", "order-card");
    const header = element("div", "order-card-header");
    const client = element("div");
    client.append(element("h4", "", `${order.clientName} ${order.clientLastname}`),
      element("span", "order-id", `ORDEN #${order.id}`));
    header.append(client, element("strong", "order-amount", price(order.amount)));
    card.append(header);
    const details = element("details");
    details.append(element("summary", "", `Ver ${order.products?.length || 0} productos`));
    const products = element("ul");
    (order.products || []).forEach((product) => {
      const row = element("li");
      row.append(element("span", "", `${product.quantity} × ${product.name}`),
        element("span", "", price(product.quantity * product.price)));
      products.append(row);
    });
    details.append(products);
    card.append(details);
    list.append(card);
  });
}

export function initOrders() {
$("#order-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const items = [...state.cart.values()];
  const order = {
    clientName: String(data.get("clientName")).trim(),
    clientLastname: String(data.get("clientLastname")).trim(),
    products: items.map(({ product, quantity }) => ({ name: product.name, quantity, price: product.price })),
  };
  if (!order.clientName || !order.clientLastname || !items.length) {
    setStatus("#order-form-status", "Indica el cliente y añade al menos un producto.", true);
    return;
  }
  const submit = $("#submit-order");
  submit.disabled = true;
  setStatus("#order-form-status", "Registrando orden…");
  try {
    const saved = await registerOrder(order);
    if (saved !== true) throw new Error("El servicio rechazó la orden.");
    form.reset();
    state.cart.clear();
    renderCart();
    await loadOrders();
    setStatus("#order-form-status", "Orden registrada correctamente.");
  } catch (error) {
    setStatus("#order-form-status", serviceError(error, "órdenes"), true);
  } finally {
    submit.disabled = state.cart.size === 0;
  }
});

$("#reload-orders").addEventListener("click", loadOrders);
}
