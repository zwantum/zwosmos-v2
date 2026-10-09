import { Node, mergeAttributes } from '@tiptap/core';

export const BlogFAQ = Node.create({
  name: 'blogFAQ',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      question: { default: 'Frequently Asked Question?' },
      answer: { default: 'Here is the detailed, informative answer to this question.' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details.zw-blog-faq',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const q =
            element.getAttribute('data-question') ||
            element.getAttribute('question') ||
            element.querySelector('.zw-blog-faq-question')?.textContent;
          const a =
            element.getAttribute('data-answer') ||
            element.getAttribute('answer') ||
            element.querySelector('.zw-blog-faq-answer')?.textContent;
          return {
            question: q || 'FAQ Question',
            answer: a || '',
          };
        },
      },
      {
        tag: 'details',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const q =
            element.getAttribute('data-question') ||
            element.getAttribute('question') ||
            element.querySelector('summary')?.textContent;
          const a =
            element.getAttribute('data-answer') ||
            element.getAttribute('answer') ||
            element.querySelector('.zw-blog-faq-answer')?.textContent ||
            element.querySelector('div')?.textContent;
          if (!q && !a) return false;
          return {
            question: q || 'FAQ Question',
            answer: a || '',
          };
        },
      },
      {
        tag: 'div.zw-blog-faq',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            question:
              element.getAttribute('data-question') ||
              element.getAttribute('question') ||
              element.querySelector('.zw-blog-faq-question')?.textContent,
            answer:
              element.getAttribute('data-answer') ||
              element.getAttribute('answer') ||
              element.querySelector('.zw-blog-faq-answer')?.textContent,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        class: 'zw-blog-faq',
        open: 'true',
        'data-question': HTMLAttributes.question,
        'data-answer': HTMLAttributes.answer,
      }),
      ['summary', { class: 'zw-blog-faq-question' }, HTMLAttributes.question || 'FAQ Question'],
      ['div', { class: 'zw-blog-faq-answer' }, HTMLAttributes.answer || ''],
    ];
  },
});
