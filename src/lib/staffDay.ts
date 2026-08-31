import type { StaffMember, StaffWorkLog } from '../types';

// Prefer stable IDs. A name-only legacy record must never override another ID.
export function attendanceOnDay(staff: Pick<StaffMember, 'id' | 'name'>, logs: StaffWorkLog[], day: string) {
  const matching = logs.filter(log => log.date === day &&
    (log.staffId ? log.staffId === staff.id : log.staffName === staff.name));
  const statuses = new Set(matching.map(log => log.status));
  if (!matching.length) return 'Sem registro' as const;
  if (statuses.size > 1) return 'Conferir registros' as const;
  return matching[0].status;
}
