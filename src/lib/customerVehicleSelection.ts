export function normalizePlate(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function escapeIlikeTerm(value: string) {
  return value.trim().replace(/[\\%_]/g, '\\$&');
}

export function resolveVehicleCustomer(selectedCustomerId: string | null, vehicleCustomerId: string | null) {
  if (selectedCustomerId && vehicleCustomerId && selectedCustomerId !== vehicleCustomerId) {
    return { customerId: selectedCustomerId, conflict: true };
  }
  return { customerId: selectedCustomerId ?? vehicleCustomerId, conflict: false };
}
