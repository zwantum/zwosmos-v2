import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Mark.create({
  name: 'fontSize',

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, '') || null,
        renderHTML: (attributes) => {
          if (!attributes.size) {
            return {};
          }
          return {
            style: `font-size: ${attributes.size}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[style*="font-size"]',
        getAttrs: (element) => {
          const size = (element as HTMLElement).style?.fontSize?.replace(/['"]+/g, '');
          return size ? { size } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain, state }) => {
          const { selection } = state;

          if (!selection.empty) {
            return chain()
              .focus()
              .setMark('fontSize', { size: fontSize })
              .run();
          }

          const { $from } = selection;
          const start = $from.start($from.depth);
          const end = $from.end($from.depth);

          if (end > start) {
            return chain()
              .focus()
              .setTextSelection({ from: start, to: end })
              .setMark('fontSize', { size: fontSize })
              .setTextSelection({ from: selection.from, to: selection.from })
              .run();
          }

          return chain()
            .focus()
            .setMark('fontSize', { size: fontSize })
            .run();
        },

      unsetFontSize:
        () =>
        ({ chain, state }) => {
          const { selection } = state;

          if (!selection.empty) {
            return chain()
              .focus()
              .unsetMark('fontSize')
              .run();
          }

          const { $from } = selection;
          const start = $from.start($from.depth);
          const end = $from.end($from.depth);

          if (end > start) {
            return chain()
              .focus()
              .setTextSelection({ from: start, to: end })
              .unsetMark('fontSize')
              .setTextSelection({ from: selection.from, to: selection.from })
              .run();
          }

          return chain()
            .focus()
            .unsetMark('fontSize')
            .run();
        },
    };
  },
});
