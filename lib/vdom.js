import dom from "./dom";
import Component from "./Component";
import { renderComponent, patchComponent } from "./renderer";
import { isSameHTMLType, isTextNode, isValidNode, setProp, removeProp, hasProp } from "./helpers";

export function createElement(node, parent) {
  if ([undefined, null, false, true].includes(node)) return null;
  if (isTextNode(node)) {
    return dom.mount(parent, document.createTextNode(node));
  }

  if (typeof node.type === "function") {
    return renderComponent(node, parent);
  }

  // Primitive e.g. "div"
  const el = document.createElement(node.type);
  updateElement(el, node);
  node.props.children.forEach(c => createElement(c, el));

  return dom.mount(parent, el) && el;
}

export function updateElement(element, newNode) {
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
    else if (prop === "style") {
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

export function patch(el, node, parent = el.parentNode) {
  if (!isValidNode(node)) return dom.unmount(parent, el);
  if (!isValidNode(el)) {
    if (isValidNode(parent)) return dom.mount(parent, createElement(node, parent));
    else return;
  }

  if (typeof node.type === "function") {
    return patchComponent(el, node, parent);
  }
  if (isTextNode(node)) {
    if (el.textContent !== node) {
      const newEl = createElement(node, parent);
      dom.replace(parent, newEl, el);
      return newEl;
    }
    return el;
  }
  if (!node.type) console.log(node);
  if (!isSameHTMLType(el, node)) {
    const newEl = createElement(node, parent);
    dom.replace(parent, newEl, el);
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