import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';

import { BlogCallout } from './callout';
import { BlogCTA } from './cta';
import { BlogFAQ } from './faq';
import { FontSize } from './fontSize';
import { BlogCitation } from './citation';
import { BlogEditorConfig } from '@zwantum/blog-types';

export function getBlogEditorExtensions(config?: BlogEditorConfig) {
  const extensions = [
    StarterKit.configure({
      heading: config?.headings !== false ? { levels: [1, 2, 3, 4, 5, 6] } : false,
      codeBlock: config?.code === false ? false : undefined,
      bulletList: { keepMarks: true },
      orderedList: { keepMarks: true },
    }),
    FontSize,
    Underline,
    Highlight.configure({ multicolor: true }),
    Link.extend({
      parseHTML() {
        return [
          {
            tag: 'a[href]:not([data-citation]):not(.zw-blog-citation)',
          },
        ];
      },
    }).configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    BlogCitation,
    Image.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          caption: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-caption') || element.getAttribute('caption') || null,
            renderHTML: (attributes) => {
              if (!attributes.caption) {
                return {};
              }
              return {
                'data-caption': attributes.caption,
              };
            },
          },
        };
      },
      renderHTML({ HTMLAttributes }) {
        const { 'data-caption': captionAttr, caption: rawCaption, ...rest } = HTMLAttributes;
        const caption = (captionAttr || rawCaption || '').toString().trim();
        if (caption) {
          return [
            'figure',
            { class: 'zw-blog-figure' },
            ['img', rest],
            ['figcaption', { class: 'zw-blog-caption' }, caption],
          ];
        }
        return ['img', rest];
      },
      parseHTML() {
        return [
          {
            tag: 'figure.zw-blog-figure',
            getAttrs: (element) => {
              const el = element as HTMLElement;
              const img = el.querySelector('img');
              if (!img) return false;
              const captionEl = el.querySelector('figcaption');
              return {
                src: img.getAttribute('src'),
                alt: img.getAttribute('alt'),
                title: img.getAttribute('title'),
                caption: captionEl?.textContent?.trim() || img.getAttribute('data-caption') || null,
              };
            },
          },
          {
            tag: 'img[src]',
            getAttrs: (element) => {
              const el = element as HTMLElement;
              return {
                src: el.getAttribute('src'),
                alt: el.getAttribute('alt'),
                title: el.getAttribute('title'),
                caption: el.getAttribute('data-caption') || el.getAttribute('caption') || null,
              };
            },
          },
        ];
      },
    }).configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'zw-blog-editor-image',
      },
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder: 'Write your story, press "/" or use the toolbar for blocks...',
    }),
    Youtube.configure({
      inline: false,
      HTMLAttributes: {
        class: 'zw-blog-editor-youtube',
      },
    }),
    BlogCallout,
    BlogCTA,
    BlogFAQ,
  ];

  return extensions;
}

export * from './callout';
export * from './cta';
export * from './faq';
export * from './fontSize';
export * from './citation';
