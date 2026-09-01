import { ServiceItem, ServiceOrder } from '../types';

export type ServiceUsage = {
  count: number;
  lastUsedAt: number;
};

export const serviceUsageKey = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();

export const buildServiceUsage = (
  orders: Pick<ServiceOrder, 'createdAt' | 'services'>[]
): Record<string, ServiceUsage> => {
  const usage: Record<string, ServiceUsage> = {};

  orders.forEach((order) => {
    const usedInOrder = new Set<string>();
    const usedAt = Date.parse(order.createdAt) || 0;

    order.services.forEach((service) => {
      const key = serviceUsageKey(service.name);
      if (!key || usedInOrder.has(key)) return;
      usedInOrder.add(key);
      const current = usage[key] ?? { count: 0, lastUsedAt: 0 };
      usage[key] = {
        count: current.count + 1,
        lastUsedAt: Math.max(current.lastUsedAt, usedAt),
      };
    });
  });

  return usage;
};

export const sortServicesByUsage = (
  services: ServiceItem[],
  usage: Record<string, ServiceUsage>
) => services
  .map((service, originalIndex) => ({ service, originalIndex, usage: usage[serviceUsageKey(service.name)] }))
  .sort((a, b) =>
    (b.usage?.count ?? 0) - (a.usage?.count ?? 0) ||
    (b.usage?.lastUsedAt ?? 0) - (a.usage?.lastUsedAt ?? 0) ||
    a.originalIndex - b.originalIndex
  )
  .map(({ service }) => service);

export const mostUsedServiceKeys = (
  usage: Record<string, ServiceUsage>,
  limit = 4
) => new Set(
  Object.entries(usage)
    .sort(([, a], [, b]) => b.count - a.count || b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit)
    .map(([key]) => key)
);
