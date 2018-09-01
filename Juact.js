import { patchComponent } from "./lib/renderer";
import Component from "./lib/Component";
import JSXToJS from "./lib/JSXtoJS";
import { createElement } from "./lib/vdom";

// Bookkeeping variables
let _rootEl;
window._appEl = null;
window._vdom = null;
let skipRender = false;

function _enqueueRender() {
  if (skipRender) return;
  skipRender = true;
  const updates = [];
  const queue = Component._renderQueue.entries();
  let current;
  while (!(current = queue.next()).done) {
    const [ component, newState ] = current.value;
    const oldState = component.state;
    const mergedState = Object.assign({}, oldState, newState);
    component.state = mergedState;
    updates.push(component);
  }
  Component._renderQueue = new Map();

  updates.forEach(component => {
    patchComponent(component._el);
  });

  skipRender = false;
}

// Main render function for attaching Juact apps to the DOM
function render(rootEl, rootComponent) {
  _rootEl = rootEl;
  _appEl = createElement(rootComponent, _rootEl);
  setInterval(() => Component._renderQueue.size && _enqueueRender(), 0);
}

// Main public interface
const Juact = {
  Component,
  h: JSXToJS,
  render,
}

export default Juact;