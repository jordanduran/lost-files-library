// Return only known categories, never database messages, keys, or user details.
export function orderPreparationError(error: { code?: string; message?: string; details?: string }, status?: number) {
  const description = `${error.message ?? ""} ${error.details ?? ""}`;
  if (/headers|bytestring|invalid character|invalid.*header/i.test(description)) return "Checkout configuration contains an invalid credential value. Please contact us. (checkout_header)";
  if (status === 0 || /fetch failed|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(description)) return "Checkout cannot reach the database. Please contact us. (checkout_connection)";
  if (status === 401 || status === 403) return "Checkout could not access the database. Please contact us. (checkout_credentials)";
  if (error.message?.includes("Already purchased")) return "You already own a selected license. Find it in My Library.";
  if (error.message?.includes("Cart changed")) return "Your saved checkout no longer matches your cart. Remove and re-add an item, then retry. (cart_changed)";
  if (error.message?.includes("Product unavailable")) return "A selected product or license is unavailable. Remove it and choose another. (product_unavailable)";
  if (error.code === "PGRST202") return "Checkout database setup is incomplete. Please contact us. (checkout_migration_missing)";
  if (["42501", "PGRST301", "PGRST302", "PGRST303"].includes(error.code ?? "") || /invalid api key/i.test(error.message ?? "")) return "Checkout could not access the database. Please contact us. (checkout_credentials)";
  if (error.code === "23503") return "Checkout could not match your account or product. Please contact us. (checkout_reference)";
  if (error.code === "23505") return "Your cart contains a duplicate selection. Remove and re-add the item. (checkout_duplicate)";
  const code = /^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(error.code ?? "") ? error.code : "unknown";
  const http = Number.isInteger(status) && status! >= 100 && status! <= 599 ? status : "unknown";
  return `Could not prepare your order. Please try again. (checkout_database_${code}_${http})`;
}
