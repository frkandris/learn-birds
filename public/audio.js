// Hanglejátszás és a hozzá tartozó, futó szonogram.
// A madarászok szonogramról olvassák a hangot; a kártyán ugyanez fut,
// amíg szól a felvétel — látszik a ritmus, de a fajt a fül dönti el.

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

export class Player {
  constructor(audioEl, canvas) {
    this.audio = audioEl;
    this.canvas = canvas;
    this.ctx2d = canvas.getContext('2d');
    this.audioCtx = null;
    this.analyser = null;
    this.raf = null;
    this.listeners = new Set();

    for (const event of ['play', 'pause', 'ended', 'error']) {
      audioEl.addEventListener(event, () => {
        if (event === 'play') this.#startDrawing();
        else this.#stopDrawing();
        this.listeners.forEach((fn) => fn(event));
      });
    }
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  load(url) {
    this.stop();
    this.clear();
    this.audio.src = url;
    this.audio.load();
  }

  get playing() {
    return !this.audio.paused && !this.audio.ended;
  }

  // Koppintáskor hívandó: a böngésző csak felhasználói gesztusból engedi
  // elindítani a hangkörnyezetet, és amíg az alszik, a lejátszás sem halad.
  unlock() {
    this.#connect();
    if (this.audioCtx?.state === 'suspended') this.audioCtx.resume().catch(() => {});
  }

  async toggle() {
    if (this.playing) {
      this.audio.pause();
      return;
    }
    await this.play();
  }

  // Elejéről indít, és sosem állít meg: az automatikus indítás ezt hívja, hogy
  // a közben már elindított lejátszást ne kapcsolja ki.
  async play() {
    if (this.playing) return;
    this.unlock();
    if (this.audio.ended || this.audio.currentTime > 0) this.audio.currentTime = 0;
    try {
      await this.audio.play();
    } catch {
      // Megtagadott automatikus indítás vagy dekódolási hiba: a kártya jelezze,
      // hogy koppintani kell, ne maradjon néma gomb magyarázat nélkül.
      this.listeners.forEach((fn) => fn('error'));
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  clear() {
    const { width, height } = this.canvas;
    this.ctx2d.clearRect(0, 0, width, height);
  }

  // A Web Audio elemzőt csak koppintásra kötjük be: iOS csak felhasználói
  // gesztusból engedi elindítani a hangkörnyezetet.
  #connect() {
    if (this.analyser || REDUCED.matches) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      this.audioCtx = new Ctx();
      const source = this.audioCtx.createMediaElementSource(this.audio);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.55;
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch {
      this.analyser = null; // marad a sima lejátszás, szonogram nélkül
    }
  }

  #startDrawing() {
    if (!this.analyser || this.raf) return;
    const { width, height } = this.canvas;
    const bins = new Uint8Array(this.analyser.frequencyBinCount);
    const nyquist = (this.audioCtx?.sampleRate ?? 44100) / 2;
    const ctx = this.ctx2d;

    // Képsoronként egy frekvenciasáv, logaritmikusan: alul 550 Hz,
    // fölül 9 kHz — ide esik a madárhangok java.
    const lo = 550;
    const hi = 9000;
    const binForY = new Uint16Array(height);
    // A természetes felvételek alapzaja a mély tartományban a legerősebb,
    // ezért lefelé haladva egyre többet vágunk le belőle.
    const cutForY = new Float32Array(height);
    for (let y = 0; y < height; y += 1) {
      const freq = lo * Math.pow(hi / lo, 1 - y / height);
      binForY[y] = Math.min(bins.length - 1, Math.round((freq / nyquist) * bins.length));
      cutForY[y] = 0.3 + 0.34 * (y / height);
    }

    let lastX = -1;

    const step = () => {
      // Kép és hang módban, illetve felfedés után a vászon rejtve van: ott a
      // rajzolás csak az akkumulátort fogyasztaná. Kártyán belül rejtettből
      // nem lesz újra látható, a következő lejátszás pedig újraindítja.
      if (!this.canvas.offsetWidth) {
        this.raf = null;
        return;
      }
      this.analyser.getByteFrequencyData(bins);

      // A rajz balról jobbra épül, a felvétel haladásával. A lejátszási idő
      // képkockánként picit vissza is léphet, ezért csak a valódi
      // visszatekerés töröl — egyébként az írótoll csak előrefelé halad.
      const length = this.audio.duration || 22;
      const x = Math.min(width - 1, Math.floor((this.audio.currentTime / length) * width));
      if (x < lastX - 20) {
        ctx.clearRect(0, 0, width, height);
        lastX = -1;
      }
      if (x > lastX) {
        ctx.clearRect(x, 0, 3, height);
        lastX = x;
      }

      for (let y = 0; y < height; y += 1) {
        const cut = cutForY[y];
        const v = Math.pow(Math.max(0, (bins[binForY[y]] / 255 - cut) / (1 - cut)), 1.2);
        if (v < 0.04) continue;
        ctx.fillStyle = PALETTE[Math.round(Math.min(1, v) * 255)];
        ctx.fillRect(x, y, 2, 1);
      }

      // Az írótoll helye: halvány vonal a friss oszlop előtt.
      ctx.fillStyle = 'rgba(240,237,226,0.35)';
      ctx.fillRect(Math.min(width - 1, x + 2), 0, 1, height);

      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  #stopDrawing() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }
}

// Halk hang: halvány kék, erős: cinegesárga, csúcs: csontfehér.
// Előre kiszámolva: a hurok képkockánként több száz pontot színez, ott ne
// készüljön se tömb, se szöveg.
const PALETTE = Array.from({ length: 256 }, (_, i) => shade(i / 255));

function shade(v) {
  const stops = [
    [0, [70, 112, 172]],
    [0.45, [233, 195, 55]],
    [1, [240, 237, 226]],
  ];
  let color = stops[stops.length - 1][1];
  for (let i = 1; i < stops.length; i += 1) {
    if (v <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const k = (v - t0) / (t1 - t0);
      color = c0.map((channel, j) => Math.round(channel + (c1[j] - channel) * k));
      break;
    }
  }
  return `rgba(${color[0]},${color[1]},${color[2]},${(0.2 + 0.8 * v).toFixed(2)})`;
}
