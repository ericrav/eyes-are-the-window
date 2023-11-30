document.addEventListener('DOMContentLoaded', () => {

  leftEye.addEventListener('click', () => {
    const windowFeatures =  csv({
      popup: true,
      width: 250,
      height: 250,
      left: Math.floor(screen.width / 2 - 125),
      top: Math.floor(screen.height / 2 - 125),
    });

    console.log(windowFeatures)
    window.open(window.location.href, 'mywindow', windowFeatures);
  });

});

function csv(obj) {
  return Object.entries(obj).map(([key, value]) => `${key}=${value}`).join(',');
}
