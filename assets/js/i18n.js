// i18n helper — strings come from PHP (window.TIMO_I18N)
function t(key) {
  return (window.TIMO_I18N && window.TIMO_I18N[key]) || key;
}
