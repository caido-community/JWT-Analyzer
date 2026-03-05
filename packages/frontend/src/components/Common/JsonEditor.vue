<template>
  <div
    ref="editorRoot"
    class="json-editor-root"
    :class="[
      hasError ? 'json-editor--error' : '',
      readonly ? 'json-editor--readonly' : '',
    ]"
  />
</template>

<script setup lang="ts">
import { json } from "@codemirror/lang-json";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { tags } from "@lezer/highlight";
import { basicSetup, EditorView } from "codemirror";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
    hasError?: boolean;
    minHeight?: string;
    maxHeight?: string;
  }>(),
  {
    readonly: false,
    hasError: false,
    minHeight: "120px",
    maxHeight: "400px",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const editorRoot = ref<HTMLElement | undefined>(undefined);
let view: EditorView | undefined = undefined;

const caidoTheme = EditorView.theme(
  {
    "&": {
      fontSize: "12px",
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
      backgroundColor: "transparent",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    ".cm-content": {
      padding: "8px 0",
      caretColor: "hsl(var(--c-primary-400))",
    },
    ".cm-line": {
      padding: "0 10px",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "hsl(var(--c-primary-400))",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "hsl(var(--c-primary-700) / 0.4) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "hsl(var(--c-primary-700) / 0.5) !important",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-activeLine": {
      backgroundColor: "hsl(var(--c-surface-800) / 0.6)",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "hsl(var(--c-surface-700))",
      border: "none",
      color: "hsl(var(--c-surface-300))",
      padding: "0 4px",
    },
  },
  { dark: true },
);

const jsonHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.propertyName, color: "#79c0ff" },
    { tag: tags.string, color: "#a5d6a7" },
    { tag: tags.number, color: "#f0883e" },
    { tag: [tags.bool, tags.null], color: "#ff7b72" },
    { tag: tags.punctuation, color: "#8b949e" },
    { tag: tags.bracket, color: "#c9d1d9" },
    { tag: tags.comment, color: "#6e7681", fontStyle: "italic" },
  ]),
);

function buildExtensions(): NonNullable<
  Parameters<typeof EditorState.create>[0]
>["extensions"] {
  const extensions = [
    basicSetup,
    json(),
    caidoTheme,
    jsonHighlight,
    EditorView.lineWrapping,
  ];

  if (!props.readonly) {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit("update:modelValue", update.state.doc.toString());
        }
      }),
    );
  } else {
    extensions.push(
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
    );
  }

  return extensions;
}

onMounted(() => {
  if (!editorRoot.value) return;

  view = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions: buildExtensions(),
    }),
    parent: editorRoot.value,
  });
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== newVal) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: newVal },
      });
    }
  },
);

onBeforeUnmount(() => {
  view?.destroy();
  view = undefined;
});
</script>

<style scoped>
.json-editor-root {
  border: 1px solid hsl(var(--c-surface-700));
  border-radius: 6px;
  overflow: hidden;
  height: v-bind(minHeight);
  background-color: hsl(var(--c-surface-900));
  transition: border-color 0.15s;
}

.json-editor-root:focus-within {
  border-color: hsl(var(--c-primary-500));
}

.json-editor--error {
  border-color: hsl(var(--c-danger-500) / 0.5) !important;
}

.json-editor--readonly :deep(.cm-content) {
  cursor: default;
}

.json-editor-root :deep(.cm-editor) {
  height: 100%;
}

.json-editor-root :deep(.cm-scroller) {
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--c-surface-600)) transparent;
}

.json-editor-root :deep(.cm-scroller)::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.json-editor-root :deep(.cm-scroller)::-webkit-scrollbar-thumb {
  background: hsl(var(--c-surface-600));
  border-radius: 4px;
}

.json-editor-root :deep(.cm-scroller)::-webkit-scrollbar-track {
  background: transparent;
}
</style>
