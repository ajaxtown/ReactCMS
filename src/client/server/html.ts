import { TypeSettings } from "../types";
import config from "../../config";
import { util } from "../common/util";
import utils from "../../shared/util";
const {
  getMetaTags,
  prepareScriptTags,
  prepareStyleTags,
  templateEngine,
} = utils;

interface IProps {
  theme: string;
  html: string;
  apolloState: object;
  initialData: object;
  head: string[];
  settings: TypeSettings;
  styles: string;
  isStatic: boolean;
}
export const getHtml = (data: IProps) => {
  const {
    theme,
    html,
    apolloState,
    initialData,
    head,
    settings,
    styles,
    isStatic,
  } = data;
  const { htmlAttrs, metaTags } = getMetaTags(head);
  const isDev = process.env.NODE_ENV !== "production";
  const host = config.ROOT_URL + config.BASE_NAME;
  let devBundles = [
    `${host}/static/src/public/js/hot-reload-bundle.js`,
    `${host}/js/vendor-bundle.js`,
    `${host}/${theme}/dist/client-bundle.js`,
  ];
  const prodBundles = [
    `${host}/js/vendor-bundle.min.js`,
    `${host}/${theme}/dist/client-bundle.min.js`,
  ];
  const bundles = isDev ? devBundles : prodBundles;

  const initialState = isStatic ? "" : JSON.stringify(apolloState);

  // convert the bundles into <script ...></script>
  const scripts = isStatic ? "" : prepareScriptTags(bundles);

  // get the styles only in production. for dev, it will be injected by webpack
  const styleLinks = isDev
    ? ""
    : prepareStyleTags(host + "/" + theme + "/dist/client.min.css");

  // check if the theme has defined any html template
  const themeTemplateBuffer = util.getThemeFileContents(theme, "template.tpl");

  // read the template buffer
  const template =
    themeTemplateBuffer || util.getClientFileContents("template.tpl");

  // convert the buffer into string
  const templateString = template.toString();

  // replace template variables with values and return the html markup
  return templateEngine(templateString, {
    ...config,
    HTML_CONTENT: html,
    HTML_ATTRS: htmlAttrs,
    STYLE_TAGS: styleLinks,
    STYLED_STYLES: styles,
    META_TAGS: metaTags,
    INITIAL_STATE: initialState,
    INITIAL_DATA: JSON.stringify(initialData),
    NODE_ENV: process.env.NODE_ENV,
    TRACKING_ID: settings.google_analytics.value,
    FAVICON: settings.site_favicon.value,
    GA_SCRIPT_TAG: settings.google_analytics.value
      ? '<script async src="https://www.googletagmanager.com/gtag/js?id=UA-19390409-3"></script>'
      : "",
    SCRIPT_TAGS: scripts,
  });
};
