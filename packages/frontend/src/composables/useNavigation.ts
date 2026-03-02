import { ref } from "vue";

export type PageType =
  | "Dashboard"
  | "Decoder"
  | "Token Details"
  | "JWT Editor"
  | "Help & Docs";

export const useNavigation = () => {
  const currentPage = ref<PageType>("Dashboard");

  const setPage = (page: PageType) => {
    currentPage.value = page;
  };

  return {
    currentPage,
    setPage,
  };
};
