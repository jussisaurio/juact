import { create } from "domain";

// Bookkeeping variables
let _rootEl;
window._appEl = null;
window._vdom = null;
let _renderQueue = new Map();

// Base component class
class Component {
  constructor(props) {
    this.props = props;
    this.state = {};
  }

  componentDidMount() {}
  componentDidUpdate(oldState) {
    //console.log("Component did update", this);
    // if (oldState) console.log(oldState);
  }
  componentWillUnmount() {}

  setState(newState) {
    _renderQueue.set(this, newState);
  }

  static render(node, parent) {
    if (isJuactComponent(node.type)) {
      const instance = new node.type(node.props);
      (window.instances || (window.instances = [])).push(instance);
      instance._el = createElement(instance.render(), parent);
      instance._el._instance = instance;
      instance.componentDidMount();
      return instance._el;
    }

    return createElement(node.type(node.props), parent);
  }

  static patch(el, node, parent = el.parentNode) {
    if (el._instance) {
      el._instance.props = node ? node.props : el._instance.props;
      return patch(el, el._instance.render(), parent);
    }

    if (isJuactComponent(node.type)) {
      const newEl = Component.render(node, parent);
      if (parent) {
        parent.replaceChild(newEl, el);
        return newEl;
      }

      return newEl;
    }

    return patch(el, node.type(props), parent);
  }

  static dispatchEvent(e) {
    e.currentTarget.events[event.type](e);
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
const isJuactComponent = ctor => ctor && ctor.prototype && Object.getPrototypeOf(ctor.prototype) === Juact.Component.prototype;
const setProp = (element, name, value) => name === "children" ? null : element.setAttribute(name === "className" ? "class" : name, value);
const removeProp = (element, name) => name === "children" ? null : element.removeAttribute(name === "className" ? "class" : name);
const isValidNode = val => val != null && typeof val !== "boolean";
const isTextNode = val => ["number", "string"].includes(typeof val);
const hasProp = (obj, prop) => obj.props.hasOwnProperty(prop);
const isSameHTMLType = (el, node) => el.nodeName === node.type.toUpperCase();

// JSX => Juact.h function calls
function h(type = "div", props, ...children) {
  props = props || {};
  props.children = [].concat.apply([], children); // flatten
  
  return { type, props };
}

// Append element to parent and call componentDidMount on Juact.Component instances
function mount(parent, element) {
  if (isValidNode(element)) parent.appendChild(element);
  return element;
}

function unmount(parent, element) {
  if (isValidNode(element)) parent.removeChild(element);
  return isValidNode(element);
}

function replace(parent, element, oldElement) {
  parent.replaceChild(element, oldElement);
  return element;
}

function createElement(node, parent) {
  if ([undefined, null, false, true].includes(node)) return null;
  if (isTextNode(node)) {
    return mount(parent, document.createTextNode(node));
  }

  if (typeof node.type === "function") {
    return Component.render(node, parent);
  }

  // Primitive e.g. 'div'
  const el = document.createElement(node.type);
  updateElement(el, node);
  node.props.children.forEach(c => createElement(c, el));

  return mount(parent, el) && el;
}

function updateElement(element, newNode) {
  const oldProps = element.getAttributeNames().reduce(
    (acc, a) => Object.assign(acc, { [a]: element.getAttribute(a) }), {}
  );
  const props = Object.assign({}, oldProps, newNode.props);
  const keys = Object.keys(props).filter(p => p !== "children");

  for (const prop of keys) {
    // Event listeners
    if (prop.startsWith("on")) {
      const event = prop.slice(2).toLowerCase();
      if (!element.events) {
        element.events = {};
      }
      if (typeof newNode.props[prop] === "function") {
        if (!element.events[event]) element.addEventListener(event, Component.dispatchEvent);
        element.events[event] = newNode.props[prop];
      } else {
        element.removeEventListener(event, Component.dispatchEvent);
      }
    }
    // Style objects
    if (prop === "style") {
      const style = newNode.props[prop];
      for (const [key, value] of Object.entries(style)) {
        element.style[key] = value;
      }
    }
    // Other properties
    else {
      if (oldProps.hasOwnProperty(prop) && !hasProp(newNode, prop)) {
        removeProp(element, prop, props[prop]);
      }

      else if (oldProps[prop] != newNode.props[prop]) {
        setProp(element, prop, props[prop]);
      }
    }
  }
}

function patch(el, node, parent = el.parentNode) {
  if (!isValidNode(node)) return unmount(parent, el);
  if (!isValidNode(el)) {
    if (isValidNode(parent)) return mount(parent, createElement(node, parent));
    else return;
  }

  if (typeof node.type === "function") {
    return Component.patch(el, node, parent);
  }
  if (isTextNode(node)) {
    if (el.textContent !== node) {
      const newEl = createElement(node, parent);
      parent.replaceChild(newEl, el);
      return newEl;
    }
    return el;
  }
  if (!node.type) console.log(node);
  if (!isSameHTMLType(el, node)) {
    const newEl = createElement(node, parent);
    parent.replaceChild(newEl, el);
    return newEl;    
  }

  updateElement(el, node);

  const newChildren = node.props.children;
  const childNodes = [].slice.call(el.childNodes);
  const numChildren = Math.max(childNodes.length, newChildren.length);
  for (let i = 0; i < numChildren; i++) {
    patch(childNodes[i], newChildren[i], el);
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
    Component.patch(component._el);
  })

  skipRender = false;
}

// Main render function for attaching Juact apps to the DOM
function render(rootEl, rootComponent) {
  _rootEl = rootEl;
  _appEl = createElement(rootComponent, _rootEl);
  setInterval(() => _renderQueue.size && _enqueueRender(), 0);
}