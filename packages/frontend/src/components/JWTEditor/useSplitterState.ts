import { ref } from "vue";

const _rightPanelWidth = ref(296);
const _keyManagerHeight = ref(240);

export function useSplitterState() {
  return {
    rightPanelWidth: _rightPanelWidth,
    keyManagerHeight: _keyManagerHeight,
  };
}
