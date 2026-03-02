// Shared PrimeVue Dialog :pt passthrough for consistent modal styling across the plugin.
export const dialogPt = {
  mask: {
    class:
      "fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-6",
  },
  root: {
    class:
      "bg-surface-900 border border-surface-700 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]",
  },
  header: {
    class:
      "px-6 py-4 border-b border-surface-700 flex items-center justify-between shrink-0",
  },
  title: {
    class: "text-sm font-semibold text-surface-100",
  },
  headerActions: {
    class: "flex items-center",
  },
  closeButton: {
    class:
      "ml-2 text-surface-400 hover:text-surface-100 rounded-lg p-1.5 hover:bg-surface-700/60 transition-colors cursor-pointer flex items-center justify-center w-7 h-7",
  },
  closeIcon: {
    class: "text-xs",
  },
  content: {
    class: "px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1",
  },
  footer: {
    class:
      "px-6 py-4 border-t border-surface-700 flex items-center justify-end gap-2 shrink-0",
  },
};
