// The keyboard handler is already headless and presentation-free: it is a
// render-prop that decides what Enter / ⇧Enter / ↑ / ↓ / Esc mean and hands
// back an onKeyDown. Nothing in it needs porting to HeroUI, so the composer
// family re-exports the existing implementation verbatim rather than forking
// it — one behavior contract, one place to change it.
export { InputBarKeyboardHandler } from '../InputBarKeyboardHandler';
