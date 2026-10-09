import { Mark, mergeAttributes } from '@tiptap/core';

export interface CitationOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blogCitation: {
      setCitation: (attributes: { href: string; target?: string | null; rel?: string | null; title?: string | null }) => ReturnType;
      toggleCitation: (attributes: { href: string; target?: string | null; rel?: string | null; title?: string | null }) => ReturnType;
      unsetCitation: () => ReturnType;
    };
  }
}

export const BlogCitation = Mark.create<CitationOptions>({
  name: 'blogCitation',
  inclusive: false,
  priority: 1001,
  excludes: 'link',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => element.getAttribute('href'),
        renderHTML: (attributes) => {
          if (!attributes.href) return {};
          return { href: attributes.href };
        },
      },
      target: {
        default: '_blank',
        parseHTML: (element) => element.getAttribute('target'),
        renderHTML: (attributes) => {
          if (!attributes.target) return {};
          return { target: attributes.target };
        },
      },
      rel: {
        default: 'noopener noreferrer',
        parseHTML: (element) => element.getAttribute('rel'),
        renderHTML: (attributes) => {
          if (!attributes.rel) return {};
          return { rel: attributes.rel };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('title'),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      'data-citation': {
        default: 'true',
        parseHTML: () => 'true',
        renderHTML: () => ({ 'data-citation': 'true' }),
      },
      class: {
        default: 'zw-blog-citation',
        parseHTML: () => 'zw-blog-citation',
        renderHTML: () => ({ class: 'zw-blog-citation' }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-citation]',
        priority: 1001,
      },
      {
        tag: 'a.zw-blog-citation',
        priority: 1001,
      },
      {
        tag: 'cite.zw-blog-citation a',
        priority: 1001,
      },
      {
        tag: 'citation',
        priority: 1001,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'zw-blog-citation',
        'data-citation': 'true',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCitation:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, {
            ...attributes,
            'data-citation': 'true',
            class: 'zw-blog-citation',
          });
        },
      toggleCitation:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, {
            ...attributes,
            'data-citation': 'true',
            class: 'zw-blog-citation',
          });
        },
      unsetCitation:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
