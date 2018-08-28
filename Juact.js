// Bookkeeping variables
let _rootEl;
let _appEl;
window._vdom = null;
let _instances = new WeakMap();
let _instanceGuidMap = {};
let _guid = 0;
let _renderQueue = new Map();

// Base component class
class Component {
  constructor(props) {
    this.props = props;
    this.state = {};
  }

  componentDidMount() {}
  componentDidUpdate(oldState) {
    console.log("Component did update", this);
    if (oldState) console.log(oldState);
  }
  componentWillUnmount() {}

  setState(newState) {
    _renderQueue.set(this, newState);
  }

  render() {
    throw new Error("Component must implement render method");
  }
}

// Main public interface
const Juact = {
  Component,
  h,
  render,
}
export default Juact;

// Helpers
const isJuactComponent = ctor => Object.getPrototypeOf(ctor.prototype) === Juact.Component.prototype;
const setProp = (element, name, value) => name === "children" ? null : element.setAttribute(name === "className" ? "class" : name, value);
const removeProp = (element, name) => name === "children" ? null : element.removeAttribute(name === "className" ? "class" : name);
const isDefined = val => val != null;
const isTextNode = val => ["number", "string"].includes(typeof val);
const hasProp = (obj, prop) => obj.props.hasOwnProperty(prop);

// JSX => Juact.h function calls
function h(type = "div", props, ...children) {
  props = props || {};
  props.children = [].concat.apply([], children); // flatten
  
  // Component
  if (typeof type === "function") {
    if (isJuactComponent(type)) {
      const instance = new type(props);
      instance.vdom = instance.render();
      const guid = ++_guid;
      _instanceGuidMap[guid] = instance;
      return Object.assign(instance.vdom, { _instance: guid });
    }

    return type(props);
  }

  // Element primitive, e.g. "div"
  return { type, props };
}

// Append element to parent and call componentDidMount on Juact.Component instances
function mount(element, parent) {
  parent.appendChild(element);
  const instanceGuid = _instances.get(element);
  if (instanceGuid != null) {
    const instance = _instanceGuidMap[instanceGuid];
    instance.componentDidMount();
  }
}

function unmount(element, parent) {
  const instanceGuid = _instances.get(element);
  if (instanceGuid) {
    const instance = _instanceGuidMap[instanceGuid];
    instance.componentWillUnmount();
  }  
  parent.removeChild(element);
}

function replace(element, oldElement, parent) {
  const oldInstanceGuid = _instances.get(oldElement);
  if (oldInstanceGuid) {
    const oldInstance = _instanceGuidMap[oldInstanceGuid];
    oldInstance.componentWillUnmount();
  } 
  parent.replaceChild(oldElement, element);
  const instanceGuid = _instances.get(element);
  if (instanceGuid) {
    const instance = _instanceGuidMap[instanceGuid];
    instance.componentDidMount();
  }
}

// Convert VDom node into actual DOM node
function createElement(node) {
  if ([undefined, null, false, true].includes(node)) return null;
  if (["number", "string"].includes(typeof node)) return document.createTextNode(node);

  const el = document.createElement(node.type);
  if (node._instance) {
    _instances.set(el, node._instance);
    _instanceGuidMap[node._instance]._el = el;
  }
  Object.keys(node.props).forEach(key => setProp(el, key, node.props[key]));
  node.props.children.forEach(c => {
    const childEl = createElement(c);
    if (childEl) {
      mount(childEl, el);
    }
  })


  return el;
}

function updateElement(parent, element, oldNode, newNode) {
  const props = Object.assign({}, oldNode.props, newNode.props);
  const keys = Object.keys(props).filter(p => p !== "children");
  let updated = false;
  for (const prop of keys) {
    if (hasProp(oldNode, prop) && !hasProp(newNode, prop)) {
      removeProp(element, prop, props[prop]);
      updated = true;
    }

    else if (oldNode.props[prop] != newNode.props[prop]) {
      setProp(element, prop, props[prop]);
      updated = true;
    }
  }

  if (updated && newNode._instance) {
    newNode._instance.componentDidUpdate();
  }
}

function patch(parent, element, oldNode, newNode) {
  if (oldNode === newNode) return;

  if (isDefined(oldNode) && !isDefined(newNode)) {
    unmount(element, parent);
  }

  else if (!isDefined(oldNode) && isDefined(newNode)) {
    const newEl = createElement(newNode);
    mount(newEl, parent);
  }

  else if (isTextNode(newNode) && newNode != oldNode) {
    element.nodeValue = newNode;
  }

  else if (newNode.type !== oldNode.type) {
    const newEl = createElement(newNode);
    replace(newEl, element, parent);
  }

  else {
    updateElement(parent, element, oldNode, newNode);

    const oldChildren = oldNode.props.children;
    const newChildren = newNode.props.children;
    const childNodes = [].slice.call(element.childNodes);
    const numChildren = Math.max(oldChildren.length, newChildren.length);
    for (let i = 0; i < numChildren; i++) {
      patch(element, childNodes[i], oldChildren[i], newChildren[i]);
    }
  }
}

let skipRender = false;
function _enqueueRender() {
  if (skipRender) return;
  skipRender = true;
  const updates = [];
  const queue = _renderQueue.entries();
  let current;
  while (!(current = queue.next()).done) {
    const [ component, newState ] = current.value;
    const oldState = component.state;
    const mergedState = Object.assign({}, oldState, newState);
    component.state = mergedState;
    updates.push(component);
  }
  _renderQueue = new Map();

  updates.forEach(component => {
    const newVdom = component.render();
    patch(component._el.parentNode, component._el, component.vdom, newVdom);
    component.vdom = newVdom;
    component.componentDidUpdate();
  })

  skipRender = false;
}

// Main render function for attaching Juact apps to the DOM
function render(rootEl, rootComponent) {
  _rootEl = rootEl;
  _appEl = createElement(rootComponent);
  _vdom = rootComponent;
  mount(_appEl, _rootEl);
  setInterval(_enqueueRender, 0);
}