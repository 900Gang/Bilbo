// Apply saved or system theme before first paint to avoid a light flash
;(function () {
  try {
    var t = localStorage.getItem('theme')
    var dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
    if (dark) document.documentElement.classList.add('dark')
  } catch (e) {}
})()
