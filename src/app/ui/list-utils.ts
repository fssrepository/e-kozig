export function smoothScroll(container: HTMLElement, target: number, duration = 240) {
    const start = container.scrollLeft;
    const delta = target - start;
    const startTime = performance.now();
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      container.scrollLeft = start + delta * ease(progress);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

export function lockFiltersScroll(container: HTMLElement, target: number) {
    let frames = 0;
    const lock = () => {
      container.scrollLeft = target;
      if (frames++ < 8) {
        requestAnimationFrame(lock);
      }
    };
    lock();
    setTimeout(() => (container.scrollLeft = target), 100);
    setTimeout(() => (container.scrollLeft = target), 200);
    setTimeout(() => (container.scrollLeft = target), 350);
  }

export function formatDate(s: string): string {
    if (!s) return '';
    const d = parseDateTime(s);
    if (Number.isNaN(d.getTime())) return s;
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) {
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    const sameYear = d.getFullYear() === now.getFullYear();
    if (sameYear) {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${String(d.getDate()).padStart(2,'0')} ${monthNames[d.getMonth()]}`;
    }
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

export function formatShortDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

export function parseDateTime(s: string): Date {
    // expected format: YYYY-MM-DD HH:mm or variants
    const parts = s.trim().split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      const [y, m, d] = datePart.split('-').map(n => Number(n));
      const [hh, mm] = timePart.split(':').map(n => Number(n));
      if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
        return new Date(y, m-1, d, hh || 0, mm || 0);
      }
    }
    const dt = new Date(s);
    return dt;
  }
