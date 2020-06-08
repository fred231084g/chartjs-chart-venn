import { defaults, Element, registerElement } from '../chart';

export class ArcSlice extends Element {
  static readonly id = 'arcSlice';
  static readonly _type = 'arcSlice';
  static readonly defaults = /* #__PURE__ */ Object.assign({}, defaults.elements.Rectangle);

  static register() {
    registerElement(ArcSlice);
  }
}
