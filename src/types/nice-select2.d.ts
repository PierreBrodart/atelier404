// nice-select2 ne fournit pas ses types : on déclare uniquement la partie utilisée.
declare module 'nice-select2' {
  export interface NiceSelectOptions {
    searchable?: boolean;
    placeholder?: string;
    hideSelect?: boolean;
  }

  export default class NiceSelect {
    constructor(element: Element, options?: NiceSelectOptions);
    update(): void;
    destroy(): void;
  }
}
