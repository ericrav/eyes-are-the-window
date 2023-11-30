document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash == '#mouth') {
    document.title = 'MOUTH';
    drawCanvas('mouth');
    return;
  }

  if (hash == '#leftEye') {
    document.title = 'LEFT EYE';
    drawCanvas('leftEye');
    return;
  }

  if (hash == '#rightEye') {
    document.title = 'RIGHT EYE';
    drawCanvas('rightEye');
    return;
  }

  if (hash == '#nose') {
    document.title = 'NOSE';
    drawCanvas('nose');
    return;
  }

  getBrowserWarning();

  start.style.display = 'block';
  start.addEventListener('click', async () => {
    start.style.display = 'none';
    await initFaceTracking();

    const getWindowFeatures = (x, y, width, height) => {
      return csv({
        popup: true,
        width,
        height,
        left: Math.floor(window.screen.availWidth / 2 - width / 2) + x,
        top: Math.floor(window.screen.availHeight / 2 - height / 2) + y,
      });
    };

    let w;
    w = window.open(
      '#leftEye',
      'leftEye',
      getWindowFeatures(-225, 0, 300, 175)
    );
    if (!w) {
      alert('Please allow popups and refresh page');
      return;
    }
    w = window.open(
      '#rightEye',
      'rightEye',
      getWindowFeatures(225, 0, 300, 175)
    );
    if (!w) {
      alert('Please allow popups and refresh page');
      return;
    }
    w = window.open('#mouth', 'mouth', getWindowFeatures(0, 250, 750, 250));
    if (!w) {
      alert('Please allow popups and refresh page');
      return;
    }
    w = window.open('#nose', 'nose', getWindowFeatures(0, 25, 200, 275));
    if (!w) {
      alert('Please allow popups and refresh page');
      return;
    }
  });
});

function csv(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

async function drawCanvas(name) {
  const videoEl = await setupWebcam();
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('canvas')
  );
  const ctx = canvas.getContext('2d');

  const loop = () => {
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;

    const box = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(name));
      } catch {
        return null;
      }
    })();
    if (box) {
      console.log(box);
      ctx.drawImage(
        videoEl,
        box.x,
        box.y,
        box.width,
        box.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
    requestAnimationFrame(loop);
  };

  loop();
}

async function setupWebcam() {
  const videoEl = /** @type {HTMLVideoElement} */ (
    document.getElementById('webcam')
  );

  const stream = await navigator.mediaDevices
    .getUserMedia({
      video: {
        width: { ideal: 4096 },
        height: { ideal: 4096 },
      },
      audio: false,
    })
    .catch((err) => {
      console.error(err);
      alert('To play, please enable camera access in your browser settings');
      throw err;
    });

  if (!stream) return;
  videoEl.srcObject = stream;

  videoEl.width = 800;
  videoEl.height = 600;

  return videoEl;
}

const model = faceapi.nets.tinyFaceDetector;

async function initFaceTracking() {
  const videoEl = await setupWebcam();
  await faceapi.loadFaceLandmarkModel('./models');
  await model.load('./models');

  const loop = async () => {
    const result = await detectFace(videoEl);

    if (!result) {
      requestAnimationFrame(loop);
      return;
    }

    const mouthBox = getBoundingBox(result.landmarks.getMouth());
    window.localStorage.setItem('mouth', JSON.stringify(mouthBox));

    const noseBox = padBox(getBoundingBox(result.landmarks.getNose()), 0.15);
    window.localStorage.setItem('nose', JSON.stringify(noseBox));

    const leftEyeBox = padBox(getBoundingBox(result.landmarks.getLeftEye()), 0.05);
    window.localStorage.setItem('leftEye', JSON.stringify(leftEyeBox));

    const rightEyeBox = padBox(getBoundingBox(result.landmarks.getRightEye()), 0.05);
    window.localStorage.setItem('rightEye', JSON.stringify(rightEyeBox));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function getBoundingBox(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;
  return { x, y, width, height };
}

function padBox(box, percent) {
  const newBox = { ...box };
  newBox.x -= box.width * percent;
  newBox.y -= box.height * percent;
  newBox.width += box.width * percent * 2;
  newBox.height += box.height * percent * 2;
  return newBox;
}

/**
 * @param {HTMLVideoElement} videoEl
 */
async function detectFace(videoEl) {
  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded()) {
    return;
  }

  const options = getFaceDetectorOptions();

  let result = await faceapi
    .detectSingleFace(videoEl, options)
    .withFaceLandmarks();

  if (result) {
    // result = resizeCanvasAndResults(result, videoEl);
  }

  return result;
}

function getFaceDetectorOptions() {
  const inputSize = 512;
  const scoreThreshold = 0.5;
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
}

function isFaceDetectionModelLoaded() {
  return !!model.params;
}

function getBrowserWarning() {
  const isChromium = window.chrome;
  const winNav = window.navigator;
  const vendorName = winNav.vendor;
  const isOpera = typeof window.opr !== 'undefined';
  const isIEedge = winNav.userAgent.indexOf('Edg') > -1;
  const isIOSChrome = winNav.userAgent.match('CriOS');
  const isArc = !!getComputedStyle(document.documentElement).getPropertyValue('--arc-palette-title');

  console.log({
    isChromium,
    vendorName,
    isOpera,
    isIEedge,
    isIOSChrome,
    isArc,
    huh: getComputedStyle(document.documentElement).getPropertyValue('--arc-palette-title')
  })

  if (
    isChromium !== null &&
    typeof isChromium !== 'undefined' &&
    vendorName === 'Google Inc.' &&
    isOpera === false &&
    isIEedge === false &&
    !isIOSChrome &&
    !isArc
  ) {
    // is Google Chrome
  } else {
    alert(
      'Please use Google Chrome on desktop.'
    );
  }
}
