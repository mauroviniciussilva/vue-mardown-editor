<template>
  <div class="vue-markdown-wrapper">
    <header>
      <span class="mdi mdi-format-bold" @click="applyMarkdownSyntax('**')" />
      <span class="mdi mdi-format-italic" @click="applyMarkdownSyntax('_')" />
      <span class="mdi mdi-format-underline" @click="handleClickUnderline" />
      <span class="mdi mdi-format-title" @click="handleClickTitle" />
      <span class="mdi mdi-format-quote-close" @click="handleClickQuote" />
      <span class="mdi mdi-format-eye" />
      <span>...</span>
    </header>
    <textarea v-model="inputValue" ref="textarea" />
    <pre v-html="compiledMarkdown" />
  </div>
</template>

<script>
import { sanitize } from 'dompurify';
import { marked } from 'marked';

export default {
  name: 'VueMarkdown',
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      inputValue: this.modelValue,
    };
  },
  computed: {
    compiledMarkdown() {
      const sanitizedInput = sanitize(this.inputValue);
      return marked(sanitizedInput);
    },
  },
  methods: {
    getSelection() {
      const start = this.$refs.textarea.selectionStart;
      const end = this.$refs.textarea.selectionEnd;
      const selection = this.inputValue.substring(start, end);

      return { start, end, selection };
    },
    getLineInfo() {
      const { selectionStart } = this.$refs.textarea;

      const lineIndex = this.inputValue.substring(0, selectionStart).split(/\r?\n|\r/).length - 1;
      const lineText = this.inputValue.split(/\r?\n|\r/)[lineIndex];
      const startAndEndIndexes = this.getLineStartAndEndIndexes(lineIndex);

      return { lineIndex, lineText, ...startAndEndIndexes };
    },
    getLineStartAndEndIndexes(lineIndex) {
      const lines = this.inputValue.split(/\r?\n|\r/);

      let start = 0;
      let end = this.inputValue.length;

      for (let index = 0; index < lines.length; index += 1) {
        if (index === lineIndex) break;
        start += lines[index].length + 1;
      }

      end = lines[lineIndex].length + start;

      return { start, end };
    },
    async setSelection(startIndex, endIndex) {
      this.$refs.textarea.focus();

      await this.$nextTick();

      this.$refs.textarea.setSelectionRange(startIndex, endIndex);
    },
    validateCharactersAround(startIndex, endIndex, charsStart, charsEnd) {
      const substringBefore = this.inputValue.substring(0, startIndex);
      const substringAfter = this.inputValue.substring(endIndex);

      return substringBefore.endsWith(charsStart) && substringAfter.startsWith(charsEnd);
    },
    replaceSubstring(startIndex, endIndex, replacement) {
      return `${this.inputValue.substring(0, startIndex)}${replacement}${this.inputValue.substring(endIndex)}`;
    },
    removeCharactersAround(startIndex, endIndex, charsStart, charsEnd) {
      const substringBefore = this.inputValue.substring(0, startIndex);
      const substringAfter = this.inputValue.substring(endIndex);
      const selection = this.inputValue.substring(startIndex, endIndex);

      return `${substringBefore.slice(0, startIndex - charsStart.length)}${selection}${substringAfter.slice(charsEnd.length)}`;
    },
    applyMarkdownSyntax(charsStart, charsAtEnd) {
      const { start, end, selection } = this.getSelection();

      const charsEnd = charsAtEnd ?? charsStart;

      const mustRemoveChars = this.validateCharactersAround(start, end, charsStart, charsEnd);
      const charsLength = charsStart.length;

      if (mustRemoveChars) {
        this.inputValue = this.removeCharactersAround(start, end, charsStart, charsEnd);
        this.setSelection(start - charsLength, end - charsLength);
      } else {
        this.inputValue = this.replaceSubstring(start, end, `${charsStart}${selection}${charsEnd}`);
        this.setSelection(start + charsLength, end + charsLength);
      }
    },
    handleClickUnderline() {
      this.applyMarkdownSyntax('<span style="text-decoration: underline">', '</span>');
    },
    clearTitle(lineText, start, end, selectionStart) {
      const hasSpace = lineText.startsWith('###### ');
      const textToReplace = hasSpace ? '###### ' : '######';
      const cursorPosition = selectionStart - (hasSpace ? 7 : 6);

      this.inputValue = this.replaceSubstring(start, end, lineText.replace(textToReplace, ''));
      this.setSelection(cursorPosition, cursorPosition);
    },
    addFirstTitleChar(lineText, start, end, selectionStart) {
      this.inputValue = this.replaceSubstring(start, end, `# ${lineText}`);
      const cursor = selectionStart + 2;
      this.setSelection(cursor, cursor);
    },
    addTitleChar(lineText, start, end, selectionStart) {
      this.inputValue = this.replaceSubstring(start, end, `#${lineText}`);
      const cursorPosition = selectionStart + 1;
      this.setSelection(cursorPosition, cursorPosition);
    },
    handleClickTitle() {
      const { selectionStart } = this.$refs.textarea;
      const { lineText, start, end } = this.getLineInfo();

      const mustClearTitle = lineText.startsWith('######');

      if (mustClearTitle) {
        this.clearTitle(lineText, start, end, selectionStart);
      } else if (!lineText.trim().startsWith('#')) {
        this.addFirstTitleChar(lineText, start, end, selectionStart);
      } else {
        this.addTitleChar(lineText, start, end, selectionStart);
      }
    },
    handleClickQuote() {
      const { selectionStart } = this.$refs.textarea;
      const { lineText, start, end } = this.getLineInfo();

      const mustCleatQuote = lineText.startsWith('>');

      if (mustCleatQuote) {
        const hasSpace = lineText.startsWith('> ');
        const textToReplace = hasSpace ? '> ' : '>';
        const cursorPosition = selectionStart - (hasSpace ? 2 : 1);

        this.inputValue = this.replaceSubstring(start, end, lineText.replace(textToReplace, ''));
        this.setSelection(cursorPosition, cursorPosition);
      } else {
        this.inputValue = this.replaceSubstring(start, end, `> ${lineText}`);
        const cursorPosition = selectionStart + 2;
        this.setSelection(cursorPosition, cursorPosition);
      }
    },
  },
};
</script>

<style lang="scss">
.vue-markdown-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;

  header {
    border: 1px solid lightgray;
    width: stretch;
    padding: 0.25em;

    .mdi:not(:last-child) {
      margin-right: 0.25em;
    }
  }

  textarea {
    outline: 0;
    border: 1px solid lightgray;
    border-top: 0;
    width: stretch !important;
    padding: 0.5em;
  }
}
</style>
