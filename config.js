const host = location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";

export const API = {
  products: `http://${host}:8081/api/v1/products/`,
  orders: `http://${host}:8082/api/v1/orders/`,
};
