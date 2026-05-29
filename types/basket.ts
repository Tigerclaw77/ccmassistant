import type { Question, UUID } from "../lib/ccm/types";

export type { Question };

export type LegacyBasket = {
  id: UUID;
  name: string;
  questions: Question[];
};
