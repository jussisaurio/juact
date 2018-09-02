import dom from "./dom";
import Component from "./Component";
import {
  isSameHTMLType,
  isTextNode,
  isJuactComponent,
  isValidNode,
  setProp,
  removeProp,
  hasProp
} from "./helpers";

const TEXT_NODE = 3;

export const jsxMap = new WeakMap();

export function patchComponent(
  el,
  node,
  oldNode,
  parent = el.parentNode,
  oldState
) {
  if (el._instance) {
    const oldProps = el._instance.props;
    oldState = oldState || el._instance.state;
    el._instance.props = node.props;
    const oldVdom = jsxMap.get(el._instance);
    const newVdom = el._instance.render();
    jsxMap.set(el._instance, newVdom);
    patch(el, newVdom, oldVdom, parent);
    el._instance.componentDidUpdate(oldProps, oldState);
    return;
  }

  patch(el, renderComponent(node), renderComponent(oldNode), parent);
}

export function renderComponent(node) {
  if (typeof node.type === "function") {
    if (isJuactComponent(node.type)) {
      const instance = new node.type(node.props);
      jsxMap.set(instance, instance.render());
      return renderComponent(Object.assign(jsxMap.get(instance), { instance }));
    }

    return renderComponent(node.type(node.props));
  }

  return node != null ? node : "";
}

export function createElement(node) {
  const el = isTextNode(node)
    ? document.createTextNode(node)
    : document.createElement(node.type);

  if (el.nodeType !== TEXT_NODE) {
    updateElement(el, { props: {} }, node);

    node.props.children.forEach(c => {
      c = renderComponent(c);
      const childEl = createElement(c);
      dom.mount(el, childEl);
    });
  }

  if (node.instance) {
    el._instance = node.instance;
    node.instance._el = el;
  }

  return el;
}

export function updateElement(element, oldNode, newNode) {
  const props = Object.assign({}, oldNode.props, newNode.props);
  const keys = Object.keys(props);

  for (const prop of keys) {
    if (prop === "children") continue;

    if (prop.startsWith("on")) {
      const event = prop.slice(2).toLowerCase();
      if (!element.events) {
        element.events = {};
      }
      if (typeof newNode.props[prop] === "function") {
        if (!element.events[event])
          element.addEventListener(event, Component.dispatchEvent);
        element.events[event] = newNode.props[prop];
      } else {
        element.removeEventListener(event, Component.dispatchEvent);
      }
    }

    // Style objects
    else if (prop === "style") {
      const style = newNode.props[prop];
      const oldStyle = oldNode.props[prop];
      for (const [key, value] of Object.entries(style)) {
        if (!oldStyle || oldStyle[key] !== value) element.style[key] = value;
      }
    }

    // Other properties
    else {
      if (hasProp(oldNode, prop) && !hasProp(newNode, prop)) {
        removeProp(element, prop, props[prop]);
      } else if (oldNode.props[prop] != newNode.props[prop]) {
        setProp(element, prop, props[prop]);
      }
    }
  }
}

export function patch(el, node, oldNode, parent = el.parentNode) {
  // Old node exists, new one doesnt => unmount
  if (isValidNode(oldNode) && !isValidNode(node)) {
    dom.unmount(parent, el);
    return;
  }

  // New node exists, old node doesn't => create and mount
  if (!isValidNode(oldNode) && isValidNode(node)) {
    dom.mount(parent, createElement(renderComponent(node)));
    return;
  }

  // New node is text node. Unless exactly the same as the old node, create and replace old with new.
  if (isTextNode(node)) {
    if (node != oldNode) {
      const newEl = createElement(node);
      dom.replace(parent, newEl, el);
    }
    return;
  }

  // New node is a component (functional or class)
  if (typeof node.type === "function") {
    if (
      !el._instance ||
      el._instance.shouldComponentUpdate(node.props, el._instance.state)
    ) {
      patchComponent(el, node, oldNode, parent);
    }
    return;
  }

  if (!isSameHTMLType(el, node)) {
    const newEl = createElement(node);
    dom.replace(parent, newEl, el);
    return newEl;
  }

  updateElement(el, oldNode, node);

  const newChildren = node.props.children;
  const oldChildren = oldNode.props.children;
  const childNodes = [].slice.call(el.childNodes);
  const numChildren = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < numChildren; i++) {
    patch(childNodes[i], newChildren[i], oldChildren[i], el);
  }
}
