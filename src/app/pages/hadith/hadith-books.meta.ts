export interface HadithBookMeta {
  id: string;
  name: string;
  arabicName: string;
  count: string;
}

export const HADITH_BOOKS: HadithBookMeta[] = [
  { id: 'sahih-bukhari', name: 'Sahih Al-Bukhari', arabicName: 'صحيح البخاري', count: '7276' },
  { id: 'sahih-muslim', name: 'Sahih Muslim', arabicName: 'صحيح مسلم', count: '7564' },
  { id: 'abu-dawood', name: 'Sunan Abu Dawud', arabicName: 'سنن أبو داود', count: '5274' },
  { id: 'al-tirmidhi', name: 'Jami At-Tirmidhi', arabicName: 'جامع الترمذي', count: '3956' },
  { id: 'sunan-nasai', name: "Sunan An-Nasa'i", arabicName: 'سنن النسائي', count: '5761' },
  { id: 'ibn-e-majah', name: 'Sunan Ibn Majah', arabicName: 'سنن ابن ماجه', count: '4341' }
];

export function hadithBookTitle(slug: string): string {
  return HADITH_BOOKS.find(b => b.id === slug)?.name ?? slug;
}
