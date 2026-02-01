declare namespace Pounce {
  // --- Core Types ---
  type TagName = string; // Replaces `keyof HTMLElementTagNameMap`

  // --- Node (Base for all elements) ---
  interface Node {
    readonly nodeType: number;
    readonly nodeName: string;
    textContent: string | null;
    readonly childNodes: Node[];
    appendChild(child: Node): Node;
    removeChild(child: Node): Node;
    contains(other: Node): boolean;
  }

  // --- Element (Base for HTMLElement) ---
  interface Element extends Node {
    readonly tagName: TagName;
    readonly attributes: Record<string, string>;
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    matches(selectors: string): boolean;
  }

  // --- HTMLElement (DOM-like elements) ---
  interface HTMLElement extends Element {
    readonly style: Partial<CSSStyleDeclaration>;
    className: string;
    id: string;
    innerHTML: string;
    children: HTMLElement[];
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    dispatchEvent(event: Event): boolean;
    focus(): void;
    blur(): void;
  }

  // --- CSSStyleDeclaration (Minimal) ---
  interface CSSStyleDeclaration {
    [key: string]: string | undefined;
  }

  // --- Event System ---
  interface Event {
    readonly type: string;
    readonly target: HTMLElement | null;
    readonly currentTarget: HTMLElement | null;
    readonly bubbles: boolean;
    readonly cancelable: boolean;
    preventDefault(): void;
    stopPropagation(): void;
  }

  interface KeyboardEvent extends Event {
    key: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
  }

  interface MouseEvent extends Event {
    clientX: number;
    clientY: number;
    button: number;
  }

  interface EventListener {
    (event: Event): void;
  }

  // --- Document (Minimal) ---
  interface Document {
    createElement(tagName: TagName): HTMLElement;
    createTextNode(text: string): Text;
    querySelector(selectors: string): HTMLElement | null;
    querySelectorAll(selectors: string): HTMLElement[];
  }

  interface Text extends Node {
    textContent: string;
  }

  // --- Factory Functions ---
  function createElement(tagName: TagName): HTMLElement;
  function createTextNode(text: string): Text;

}
