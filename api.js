import { API } from "./config.js";

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`El servicio respondió con HTTP ${response.status}.`);
  return response.json();
}

function post(url, data) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export const getProducts = () => request(API.products);
export const registerProduct = (product) => post(`${API.products}register`, product);
export const getOrders = () => request(API.orders);
export const registerOrder = (order) => post(`${API.orders}register`, order);

export function serviceError(error, name) {
  return error instanceof TypeError
    ? `No se pudo conectar con ${name}. Comprueba que el microservicio esté encendido.`
    : error.message;
}
