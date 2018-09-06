import Component from "./lib/Component";
import DOM from "./lib/dom";
import {
  createElement,
  renderComponent,
  patchComponent,
  jsxMap
} from "./lib/vdom";
import { isValidNode } from "./lib/helpers";

// Bookkeeping variables
let _rootEl;
let _appEl;
let _vdom;
let skipRender = false;

function _enqueueRender() {
  if (skipRender) return;
  skipRender = true;

  const queue = Component._renderQueue.entries();

  const updates = [];
  let current;
  while (!(current = queue.next()).done) {
    const [component, newState] = current.value;
    const oldState = component.state;
    const mergedState = Object.assign({}, oldState, newState);
    updates.push([component, mergedState, oldState]);
  }
  Component._renderQueue = new Map();

  updates.forEach(([component, newState, oldState]) => {
    if (component.shouldComponentUpdate(component.props, newState)) {
      component.state = newState;
      patchComponent(
        component._el,
        null,
        jsxMap.get(component),
        component._el.parentNode,
        oldState
      );
    }
  });

  skipRender = false;
}

// Main render function for attaching Juact apps to the DOM
function render(rootComponent, rootEl) {
  _rootEl = rootEl;
  // Create VDOM tree
  _vdom = renderComponent(rootComponent);
  // Create DOM tree
  _appEl = createElement(_vdom);
  // Attach to document
  DOM.mount(_rootEl, _appEl);

  setInterval(() => Component._renderQueue.size && _enqueueRender(), 0);
}

// JSX => Juact.h function calls
function JsxToJs(type = "div", props, ...children) {
  props = props || {};
  props.children = [].concat.apply([], children).filter(isValidNode); // flatten, remove undef/null/true/false

  return { type, props, key: props.key };
}

// Main public interface
const Juact = {
  Component,
  h: JsxToJs,
  render
};

export default Juact;
