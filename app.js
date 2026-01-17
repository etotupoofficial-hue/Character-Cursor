const head = document.getElementById("head");
const pupilLeft = document.getElementById("pupilLeft");
const pupilRight = document.getElementById("pupilRight");
const mouth = document.getElementById("mouth");
const micToggle = document.getElementById("micToggle");
const micStatus = document.getElementById("micStatus");
const keyboard = document.getElementById("keyboard");
const armLeft = document.getElementById("armLeft");
const armRight = document.getElementById("armRight");
const mouseDevice = document.getElementById("mouseDevice");

const keys = Array.from(keyboard.querySelectorAll(".key"));
let audioContext;
let analyser;
let dataArray;
let micStream;
let mouthAnimation;
let typingTimer;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateMouseArm = (percentX, percentY) => {
  const offsetX = clamp(percentX * 16, -16, 16);
  const offsetY = clamp(percentY * 10, -10, 10);
  const rotate = clamp(percentX * 12 - 8, -18, 18);
  armRight.classList.add("mouse");
  armRight.style.setProperty("--mouse-x", `${offsetX}px`);
  armRight.style.setProperty("--mouse-y", `${offsetY}px`);
  armRight.style.setProperty("--mouse-rot", `${rotate}deg`);
  if (mouseDevice) {
    mouseDevice.classList.add("active");
    setTimeout(() => mouseDevice.classList.remove("active"), 120);
  }
};

const updateHead = (x, y) => {
  const { innerWidth, innerHeight } = window;
  const percentX = (x / innerWidth) * 2 - 1;
  const percentY = (y / innerHeight) * 2 - 1;
  const rotateX = clamp(percentY * 12, -12, 12);
  const rotateY = clamp(percentX * 18, -18, 18);

  head.style.transform = `rotateX(${rotateX * -1}deg) rotateY(${rotateY}deg)`;

  const pupilX = clamp(percentX * 8, -8, 8);
  const pupilY = clamp(percentY * 6, -6, 6);
  pupilLeft.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
  pupilRight.style.transform = `translate(${pupilX}px, ${pupilY}px)`;

  updateMouseArm(percentX, percentY);
};

const animateMouth = () => {
  if (!analyser) return;
  analyser.getByteTimeDomainData(dataArray);
  const rms = Math.sqrt(
    dataArray.reduce((sum, value) => {
      const centered = value - 128;
      return sum + centered * centered;
    }, 0) / dataArray.length
  );
  const openness = clamp((rms / 128) * 28 + 8, 8, 36);
  mouth.style.height = `${openness}px`;
  mouthAnimation = requestAnimationFrame(animateMouth);
};

const stopMic = () => {
  if (mouthAnimation) {
    cancelAnimationFrame(mouthAnimation);
    mouthAnimation = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
  mouth.style.height = "14px";
  micToggle.textContent = "Включить микрофон";
  micStatus.textContent = "Микрофон выключен";
};

const startMic = async () => {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.fftSize);
    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);
    micToggle.textContent = "Выключить микрофон";
    micStatus.textContent = "Микрофон включен";
    animateMouth();
  } catch (error) {
    micStatus.textContent = "Не удалось получить доступ к микрофону";
  }
};

micToggle.addEventListener("click", () => {
  if (micStream) {
    stopMic();
    return;
  }
  startMic();
});

window.addEventListener("mousemove", (event) => {
  updateHead(event.clientX, event.clientY);
});

const tapArms = () => {
  armLeft.classList.add("tap");
  setTimeout(() => {
    armLeft.classList.remove("tap");
  }, 120);
};

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  tapArms();
  armLeft.classList.add("typing");
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = setTimeout(() => armLeft.classList.remove("typing"), 150);
  const key = event.key.toUpperCase();
  const keyElement = keys.find((element) => element.textContent === key);
  if (keyElement) {
    keyElement.classList.add("active");
    setTimeout(() => keyElement.classList.remove("active"), 150);
  }
});

window.addEventListener("touchmove", (event) => {
  const touch = event.touches[0];
  if (!touch) return;
  updateHead(touch.clientX, touch.clientY);
});

updateHead(window.innerWidth / 2, window.innerHeight / 2);
