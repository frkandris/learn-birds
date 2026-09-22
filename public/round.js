// Egy gyakorlókör állapota: melyik kártya jön, mi került vissza a pakli
// végére, és mi lett a végeredmény. Tudatosan nem ismeri sem a DOM-ot, sem
// a tárolót — így a kör szabályai a böngészőtől függetlenül tesztelhetők.
//
// A kör szabálya: minden kiválasztott madár addig jár körbe, amíg egyszer
// sikerül. Ami elsőre megvolt, az „done”, amibe belebuktunk, az „miss”
// marad akkor is, ha később sikerül — az ütemezés ezt bünteti.

const randomPick = (items) => (items.length ? items[Math.floor(Math.random() * items.length)] : null);

export class Round {
  #queue;
  #results = new Map();

  /**
   * @param {object} options
   * @param {'image'|'sound'|'both'} options.mode gyakorlómód
   * @param {Array} options.birds a körbe választott fajok
   * @param {Function} [options.pick] média-választó (tesztben determinisztikus)
   */
  constructor({ mode, birds, pick = randomPick }) {
    this.mode = mode;
    this.order = birds.map((bird) => bird.id);
    this.startedAt = Date.now();
    this.#queue = birds.map((bird) => ({
      bird,
      failed: false,
      image: pick(bird.images),
      audio: pick(bird.audio),
    }));
  }

  get current() {
    return this.#queue[0] ?? null;
  }

  get finished() {
    return this.#queue.length === 0;
  }

  get size() {
    return this.order.length;
  }

  /** A haladásjelző állapota fajonként: 'done' | 'miss' | 'now' | ''. */
  progress() {
    const currentId = this.current?.bird.id;
    return this.order.map((id) => ({
      id,
      state: this.#results.get(id) ?? (id === currentId ? 'now' : ''),
    }));
  }

  /**
   * Lezárja az aktuális kártyát.
   * @param {boolean} ok eltalálta-e a felhasználó
   * @returns {{birdId: string, clean: boolean}|null} amit ütemezni kell, ha a
   *   kártya kikerült a körből; `null`, ha visszament a pakli végére.
   */
  grade(ok) {
    const item = this.#queue.shift();
    if (!item) return null;
    const birdId = item.bird.id;

    if (!ok) {
      item.failed = true;
      this.#results.set(birdId, 'miss');
      this.#queue.push(item);
      return null;
    }

    if (this.#results.get(birdId) !== 'miss') {
      this.#results.set(birdId, item.failed ? 'miss' : 'done');
    }
    return { birdId, clean: !item.failed };
  }

  summary() {
    const clean = [...this.#results.values()].filter((value) => value === 'done').length;
    return {
      total: this.order.length,
      clean,
      missed: this.order.length - clean,
      minutes: Math.max(1, Math.round((Date.now() - this.startedAt) / 60000)),
    };
  }
}
