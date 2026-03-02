import { ref } from "vue";

type Section = {
  id: string;
  title: string;
};

const SECTIONS: Section[] = [
  { id: "welcome", title: "Welcome" },
  { id: "dashboard", title: "Dashboard" },
  { id: "decoder", title: "JWT Decoder" },
  { id: "view-mode", title: "JWT View Mode" },
  { id: "token-details", title: "Token Details" },
  { id: "jwt-editor", title: "JWT Editor" },
  { id: "workflows", title: "Security Workflows" },
  { id: "about", title: "About" },
];

export const useSidebar = () => {
  const sections = SECTIONS;
  const activeSection = ref<string>(sections[0]?.id ?? "");

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element !== null) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return {
    sections,
    activeSection,
    scrollToSection,
  };
};
