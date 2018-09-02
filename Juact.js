import Component from "./lib/Component";
import JSXToJS from "./lib/JSXtoJS";
import dom from "./lib/dom";
import {
  createElement,
  renderComponent,
  patchComponent,
  jsxMap
} from "./lib/vdom";

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
        component.render(),
        jsxMap.get(component),
        component._el.parentNode,
        oldState
      );
    }
  });

  skipRender = false;
}

// Main render function for attaching Juact apps to the DOM
function render(rootEl, rootComponent) {
  _rootEl = rootEl;
  _vdom = renderComponent(rootComponent);
  _appEl = createElement(_vdom, _rootEl);
  dom.mount(_rootEl, _appEl);
  setInterval(() => Component._renderQueue.size && _enqueueRender(), 0);
}

// Main public interface
const Juact = {
  Component,
  h: JSXToJS,
  render
};

export default Juact;
