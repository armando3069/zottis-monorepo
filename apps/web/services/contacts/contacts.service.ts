import { createQueryKeys } from "@lukemorales/query-key-factory";
import { request } from "@/lib/api/request";
import { ROUTES } from "@/lib/api/routes";
import type { ContactRow, ContactsFilter } from "./contacts.types";

class ContactsService {
  getContacts = (filters?: ContactsFilter): Promise<ContactRow[]> => {
    const params = new URLSearchParams();
    if (filters?.platform) params.set("platform", filters.platform);
    if (filters?.lifecycle) params.set("lifecycle", filters.lifecycle);
    if (filters?.search) params.set("search", filters.search);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request.get<ContactRow[]>(`${ROUTES.conversations.contacts}${qs}`);
  };

  deleteContacts = (ids: number[]): Promise<{ deleted: number }> =>
    request.delete<{ deleted: number }>(ROUTES.conversations.deleteBulk, {
      data: { ids },
    });
}

export const contactsService = new ContactsService();

export const contactsQueryKeys = createQueryKeys("contacts", {
  list: (filters?: ContactsFilter) => ({
    queryKey: [filters],
    queryFn: () => contactsService.getContacts(filters),
  }),
});
