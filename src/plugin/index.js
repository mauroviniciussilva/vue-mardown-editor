import VueMarkdown from './components/VueMarkdown.vue';

const VueMarkdownPlugin = {
  install(app, options = {}) {
    app.component('VueMarkdown', VueMarkdown);

    console.log(app, options);
  },
};

export default VueMarkdownPlugin;
